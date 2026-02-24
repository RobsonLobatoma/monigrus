

## Plano: Preenchimento Automático dos Painéis de Monitoramento Após Sync

### Situação Atual

A tabela `grupos` está vazia. Quando o `sync-groups` funcionar (instância conectada), ele cria registros com apenas `nome`, `whatsapp_group_id`, `status=PENDENTE` e `ultima_atividade`. As colunas ficam assim:

| Coluna | Fonte Atual | Problema |
|--------|------------|----------|
| DATA/HORA | `last_message_at` ou `ultima_atividade` | Funciona parcialmente (sem mensagens, mostra data do sync) |
| GRUPO | `nome` | Funciona |
| GESTOR DE TRÁFEGO | `gestor` | Nunca preenchido pelo sync |
| SQUAD | Hardcoded `"—"` | Nunca resolvido (campo `team_id` existe mas UI ignora) |
| SATISFAÇÃO | Derivado do score | Funciona (score começa em 50 sem mensagens) |
| SCORE | `Math.min(100, mensagens/3)` | Começa em 50 (fallback), atualiza com mensagens |
| STATUS | `status` | Funciona (default PENDENTE) |
| CONVERSAS | `last_message` | Vazio até chegar mensagem via webhook |

### Correções Necessárias

#### 1. Orchestrator: Enriquecer sync-groups com gestor e team_id
**Arquivo:** `supabase/functions/whatsapp-orchestrator/index.ts`

No `sync-groups`, após criar/atualizar o grupo, buscar o usuário autenticado e associar como gestor. Também aceitar um parâmetro opcional `teamId` para vincular o grupo a um squad.

Alteracoes:
- Buscar o `user_profiles` do usuario autenticado para obter `full_name` e `team_id`
- Ao criar novo grupo, popular `gestor` com o nome do usuario, `gestor_id` com o user_id, e `team_id` com o team do usuario
- Grupos existentes sem gestor tambem recebem o gestor do usuario autenticado

#### 2. UI: Resolver coluna SQUAD pelo team_id
**Arquivos:** `src/pages/Monitoramento.tsx`, `src/pages/Hub.tsx`, `src/pages/Squads.tsx`

Todas as 3 paginas tem `squad: "—"` hardcoded. Corrigir para:
- Importar `useTeams` e criar um mapa `teamId -> teamName`
- No mapeamento de `dbGrupos`, resolver `squad` via `teams.find(t => t.id === g.team_id)?.name ?? "—"`

#### 3. Webhook: Garantir atualização correta do contador de mensagens
**Arquivo:** `supabase/functions/whatsapp-webhook/index.ts`

O webhook ja atualiza `last_message`, `last_message_at` e incrementa `mensagens`. Porem, o incremento usa duas queries separadas (select + update) que pode ter race condition. Usar uma unica operacao RPC ou consolidar.

Alem disso, o webhook precisa tambem atualizar o `status` do grupo automaticamente baseado na atividade (ex: se mensagem recebida e nao respondida em X tempo, marcar como CRITICO).

#### 4. Realtime: Ja funciona
O hook `useGroupConversations` ja escuta mudancas em `grupos` e `grupo_messages` via Supabase Realtime, invalidando a query. Nenhuma alteração necessaria.

### Detalhes Técnicos

**Mudanca no sync-groups (orchestrator):**
```
// Antes do loop de upsert:
const { data: profile } = await svc.from("user_profiles")
  .select("full_name, team_id")
  .eq("user_id", user.id)
  .maybeSingle();
const gestorName = profile?.full_name ?? null;
const gestorTeamId = profile?.team_id ?? null;

// No insert de novo grupo:
await svc.from("grupos").insert({
  nome: name,
  whatsapp_group_id: jid,
  gestor: gestorName,
  gestor_id: user.id,
  team_id: gestorTeamId,
  status: "PENDENTE",
  sla: "DENTRO DO SLA",
  ultima_atividade: new Date().toISOString()
});
```

**Mudanca nas 3 paginas (squad resolution):**
```typescript
const { data: teams } = useTeams();
const teamMap = useMemo(() => {
  const m: Record<string, string> = {};
  teams?.forEach(t => { m[t.id] = t.name; });
  return m;
}, [teams]);

// No mapeamento:
squad: g.team_id ? teamMap[g.team_id] ?? "—" : "—",
```

### Resumo das Alteracoes

1. **`whatsapp-orchestrator/index.ts`** - sync-groups popula `gestor`, `gestor_id`, `team_id` automaticamente
2. **`Monitoramento.tsx`** - resolve SQUAD via `useTeams` + `teamMap`
3. **`Hub.tsx`** - resolve SQUAD via `useTeams` + `teamMap`
4. **`Squads.tsx`** - resolve SQUAD via `useTeams` + `teamMap` (ja tem teams carregado)

