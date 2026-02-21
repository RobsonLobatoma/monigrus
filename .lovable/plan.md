
## Diagnóstico Completo

Após analisar o código e o banco de dados Supabase, aqui está a situação real:

**Tabela `grupos`** — existe, mas faltam as colunas: `gestor`, `sla`, `status`, `mensagens`, `ultima_atividade`. Atualmente só tem: `id`, `nome`, `team_id`, `sector_id`, `ativo`, `created_at`, `updated_at`.

**Tabela `teams`** — existe, mas faltam: `supervisor`, `gestores`. Atualmente só tem: `id`, `name`, `is_active`, `created_at`, `updated_at`.

**Tabela `user_profiles`** — existe com: `user_id`, `full_name`, `email`, `team_id`, `sector_id`, `is_active`. Precisa apenas ser conectada.

**Tabela `user_roles`** — existe com: `user_id`, `role` (enum `app_role`). Será usada em conjunto com `user_profiles`.

**RLS (Segurança)** — todas as tabelas têm RLS ativo. Leitura exige usuário autenticado. Escrita exige role `DIRETOR` ou `GERENTE`. Como o login ainda não está implementado, as queries retornarão vazio — os dados mockados serão mantidos como fallback visual.

---

## O que será feito

### Etapa 1 — Migração do banco de dados

Adicionar as colunas ausentes às tabelas `grupos` e `teams`:

```sql
-- teams
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS supervisor text,
  ADD COLUMN IF NOT EXISTS gestores   text[] NOT NULL DEFAULT '{}';

-- grupos
ALTER TABLE public.grupos
  ADD COLUMN IF NOT EXISTS gestor           text,
  ADD COLUMN IF NOT EXISTS sla              text NOT NULL DEFAULT 'DENTRO DO SLA',
  ADD COLUMN IF NOT EXISTS status           text NOT NULL DEFAULT 'PENDENTE',
  ADD COLUMN IF NOT EXISTS mensagens        integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultima_atividade text;
```

### Etapa 2 — Hooks React Query compartilhados

Criar três hooks de dados que qualquer página pode importar. Todos invalidam o cache automaticamente após mutações, forçando re-renderização em toda a aplicação:

**`src/hooks/useTeams.ts`**
- `useTeams()` — busca todos os squads ativos
- `useCreateTeam(onSuccess)` — insere novo squad
- `useUpdateTeam(onSuccess)` — atualiza squad por id
- `useDeleteTeam(onSuccess)` — remove squad (soft delete: `is_active = false`)

**`src/hooks/useGrupos.ts`**
- `useGrupos()` — busca todos os grupos ativos (`ativo = true`)
- `useCreateGrupo(onSuccess)` — insere novo grupo
- `useUpdateGrupo(onSuccess)` — atualiza grupo por id
- `useDeleteGrupo(onSuccess)` — soft delete (`ativo = false`)

**`src/hooks/useUserProfiles.ts`**
- `useUserProfiles()` — busca `user_profiles` com join em `user_roles`
- `useUpdateUserProfile(onSuccess)` — atualiza nome, email, team_id
- `useDeleteUserProfile(onSuccess)` — desativa (`is_active = false`)

Todos usam a chave de cache `["teams"]`, `["grupos"]`, `["user_profiles"]` e chamam `queryClient.invalidateQueries()` após cada mutação.

### Etapa 3 — Configuracoes.tsx

Substituir os `useState(initialXxx)` pelos hooks:

| Seção | Antes | Depois |
|---|---|---|
| Usuários & Cargos | `useState(initialUsers)` | `useUserProfiles()` |
| Gestão de Squads | `useState(initialSquads)` | `useTeams()` |
| Gestão de Grupos | `useState(initialGrupos)` | `useGrupos()` |

- Adicionar skeleton/spinner enquanto `isLoading = true`
- Fallback nos dados mockados caso o usuário não esteja autenticado (array vazio do Supabase → exibir mensagem de aviso)
- Todos os handlers de salvar/criar/deletar chamam as mutations dos hooks

### Etapa 4 — Hub.tsx

Substituir o array estático `GRUPOS` pelo hook `useGrupos()`:
- Cards de métricas (CRÍTICOS, SCORE MÉDIO, RESOLVIDOS) calculados dinamicamente dos dados reais
- Spinner durante carregamento
- Fallback para array vazio com mensagem informativa

### Etapa 5 — Monitoramento.tsx

Substituir o array estático `mockData` pelo hook `useGrupos()`:
- Adaptar os campos do banco (`nome`, `gestor`, `squad`, `sla`, `status`) para o formato da tabela
- Filtro de busca continua funcionando normalmente

### Fluxo de propagação automática

```text
Usuário edita/cria/remove em Configurações
        ↓ mutation Supabase
  React Query invalida cache ["grupos"] ou ["teams"]
        ↓ refetch automático
  Hub.tsx + Monitoramento.tsx re-renderizam
  com os dados atualizados imediatamente
```

### Aviso sobre autenticação

O Supabase tem RLS ativo em todas as tabelas. Sem login, as queries retornam vazio. Um banner de aviso será exibido nas páginas caso os dados estejam vazios, orientando que o login precisa ser implementado para que os dados persistam. Isso não quebra a interface — ela simplesmente exibirá listas vazias ou os fallbacks.

---

## Arquivos a criar/modificar

| Arquivo | Ação |
|---|---|
| `supabase/migrations/..._add_team_grupo_columns.sql` | Criar — adiciona colunas ausentes |
| `src/hooks/useTeams.ts` | Criar — hook CRUD de squads |
| `src/hooks/useGrupos.ts` | Criar — hook CRUD de grupos |
| `src/hooks/useUserProfiles.ts` | Criar — hook CRUD de usuários |
| `src/pages/Configuracoes.tsx` | Modificar — conectar os 3 hooks |
| `src/pages/Hub.tsx` | Modificar — dados reais via `useGrupos()` |
| `src/pages/Monitoramento.tsx` | Modificar — dados reais via `useGrupos()` |
