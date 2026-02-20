
## Objetivo

Conectar as três seções de Configurações ao Supabase para que toda criação, edição e exclusão persista no banco de dados e se reflita automaticamente nas páginas Hub e Monitoramento, que passarão a consumir os mesmos dados reais.

---

## Diagnóstico da situação atual

Todas as alterações feitas em Configurações (usuários, squads, grupos) vivem apenas em estado local React (useState). Ao recarregar a página os dados voltam ao mock. As páginas Hub e Monitoramento também usam dados mockados independentes.

---

## Tabelas do Supabase envolvidas

| Seção | Tabela(s) principal(is) | O que falta |
|---|---|---|
| Usuários & Cargos | `user_profiles` + `user_roles` | Colunas existem; falta apenas buscar e gravar |
| Gestão de Squads | `teams` | Falta: `supervisor` (text), `gestores` (text[]) |
| Gestão de Grupos | `grupos` | Falta: `gestor` (text), `sla` (text), `status` (text), `mensagens` (int), `ultima_atividade` (text) |

---

## Etapa 1 — Migração do banco de dados

Adicionar as colunas ausentes via migration:

```sql
-- Squads / teams
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS supervisor text,
  ADD COLUMN IF NOT EXISTS gestores   text[] NOT NULL DEFAULT '{}';

-- Grupos
ALTER TABLE public.grupos
  ADD COLUMN IF NOT EXISTS gestor            text,
  ADD COLUMN IF NOT EXISTS sla               text NOT NULL DEFAULT 'DENTRO DO SLA',
  ADD COLUMN IF NOT EXISTS status            text NOT NULL DEFAULT 'PENDENTE',
  ADD COLUMN IF NOT EXISTS mensagens         integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultima_atividade  text;
```

---

## Etapa 2 — Hooks de dados reutilizáveis

Criar dois hooks com React Query para que qualquer página da aplicação possa consumir os mesmos dados:

**`src/hooks/useTeams.ts`**
- `useTeams()` — lista de squads do Supabase
- `useCreateTeam()` — insere novo squad
- `useUpdateTeam()` — atualiza squad por id
- `useDeleteTeam()` — desativa ou remove squad

**`src/hooks/useGrupos.ts`**
- `useGrupos()` — lista de grupos do Supabase
- `useCreateGrupo()` — insere novo grupo
- `useUpdateGrupo()` — atualiza grupo por id
- `useDeleteGrupo()` — marca ativo = false ou remove

**`src/hooks/useUserProfiles.ts`**
- `useUserProfiles()` — lista user_profiles + user_roles
- `useUpdateUserProfile()` — atualiza nome, email, team_id
- `useDeleteUserProfile()` — desativa usuário (is_active = false)

Todos os hooks invalidam o cache do React Query após mutações, propagando a atualização imediatamente para qualquer componente que consuma o mesmo hook.

---

## Etapa 3 — Configuracoes.tsx

Substituir todos os `useState(initialXxx)` por dados vindos dos hooks:

- **Usuários & Cargos**: `useUserProfiles()` para listar; `useUpdateUserProfile()` ao salvar edição; `useDeleteUserProfile()` ao clicar no lixo.
- **Gestão de Squads**: `useTeams()` para listar; `useCreateTeam()` ao criar; `useUpdateTeam()` ao salvar edição; `useDeleteTeam()` ao remover.
- **Gestão de Grupos**: `useGrupos()` para listar; `useCreateGrupo()` ao criar; `useUpdateGrupo()` ao salvar edição; `useDeleteGrupo()` ao remover.

Adicionar estados de carregamento (spinner/skeleton) enquanto os dados chegam do banco.

---

## Etapa 4 — Hub.tsx e Monitoramento.tsx

Substituir os arrays `GRUPOS` e `mockData` pelos hooks reais:

- **Hub.tsx** → `useGrupos()` filtrando pelos grupos do usuário logado.
- **Monitoramento.tsx** → `useGrupos()` com visão global.

Os cards de métricas (CRÍTICOS, SCORE MÉDIO, RESOLVIDOS) passam a ser calculados dinamicamente a partir dos dados reais.

---

## Fluxo após a implementação

```text
Configurações (edita grupo)
        ↓
  Supabase (grupos table)
        ↓
  React Query cache invalidado
        ↓
  Hub + Monitoramento re-renderizam
  com os dados atualizados
```

---

## Nota sobre autenticação e RLS

As políticas de segurança (RLS) do Supabase exigem que o usuário esteja autenticado. As tabelas `teams` e `grupos` permitem leitura somente para usuários com os roles `DIRETOR`, `GERENTE`, `SUPERVISOR` ou `OPERACIONAL`. Escrita exige `DIRETOR` ou `GERENTE` (`can_manage_users`).

Como o sistema ainda não possui login implementado, as queries de leitura e escrita retornarão vazio ou erro de permissão para usuários não autenticados. Será adicionado um aviso visível na interface caso os dados não retornem, orientando a implementar autenticação. Os dados mockados serão mantidos como fallback enquanto não há usuário logado.

---

## Arquivos a criar/modificar

| Arquivo | Ação |
|---|---|
| `supabase/migrations/xxx_add_team_grupo_columns.sql` | Criar (migration) |
| `src/hooks/useTeams.ts` | Criar |
| `src/hooks/useGrupos.ts` | Criar |
| `src/hooks/useUserProfiles.ts` | Criar |
| `src/pages/Configuracoes.tsx` | Modificar (conectar hooks) |
| `src/pages/Hub.tsx` | Modificar (dados reais) |
| `src/pages/Monitoramento.tsx` | Modificar (dados reais) |
