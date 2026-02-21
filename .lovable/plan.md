

## Plano: Promover usuario a DIRETOR + Conectar Configuracoes ao Supabase

### O que sera feito

1. **Atualizar o cargo de `rowaizemarketing@gmail.com` para DIRETOR** no banco de dados (tabela `user_roles`)
2. **Criar 3 hooks React Query** para buscar dados reais do Supabase
3. **Conectar a pagina Configuracoes** ao banco de dados, mantendo os dados mockados como fallback
4. **Conectar Hub e Monitoramento** aos dados reais de grupos

### Usuarios existentes no banco

| Nome | Email | Cargo Atual |
|---|---|---|
| Rowaize Marketing Digital | rowaizemarketing@gmail.com | OPERACIONAL -> **DIRETOR** |
| robsonlobato31 | robsonlobato31@gmail.com | OPERACIONAL |
| Robson Lobato | rowaizemkt@gmail.com | DIRETOR |

As tabelas `teams` e `grupos` estao vazias no banco. Os dados mockados serao mantidos como fallback visual ate que dados reais sejam inseridos.

---

### Etapa 1 — Atualizar cargo no banco

Executar UPDATE na tabela `user_roles` para alterar o role de `rowaizemarketing@gmail.com` (user_id: `10c6d7c8-3fb5-4474-9442-2960e178bb0d`) de `OPERACIONAL` para `DIRETOR`.

### Etapa 2 — Criar hooks compartilhados

Criar 3 arquivos com hooks React Query que buscam dados do Supabase e invalidam cache apos mutacoes:

| Arquivo | Funcionalidade |
|---|---|
| `src/hooks/useUserProfiles.ts` | Lista `user_profiles` + `user_roles` com join; mutations para update e delete |
| `src/hooks/useTeams.ts` | Lista `teams` ativas; mutations para create, update e delete (soft delete) |
| `src/hooks/useGrupos.ts` | Lista `grupos` ativos; mutations para create, update e delete (soft delete) |

### Etapa 3 — Atualizar Configuracoes.tsx

- Importar os 3 hooks
- Substituir `useState(initialUsers)` por dados de `useUserProfiles()` — manter `initialUsers` como fallback se array vazio
- Substituir `useState(initialSquads)` por dados de `useTeams()` — manter `initialSquads` como fallback
- Substituir `useState(initialGrupos)` por dados de `useGrupos()` — manter `initialGrupos` como fallback
- Todos os handlers de criar/editar/deletar chamam as mutations dos hooks
- Adicionar indicador de carregamento (loading state)
- **Nenhuma alteracao de layout, menu ou funcionalidade existente**

### Etapa 4 — Atualizar Hub.tsx e Monitoramento.tsx

- Importar `useGrupos()` para substituir arrays estaticos `GRUPOS` e `mockData`
- Manter dados mockados como fallback quando o banco estiver vazio
- Calcular metricas dinamicamente dos dados reais
- **Nenhuma alteracao visual**

---

### Detalhes tecnicos

Os hooks usam `useQuery` com chaves `["user-profiles"]`, `["teams"]`, `["grupos"]`. Apos qualquer mutacao (create/update/delete), o cache e invalidado via `queryClient.invalidateQueries()`, forçando re-fetch automatico em todas as paginas que consomem o mesmo hook.

O RLS do Supabase exige usuario autenticado. Com o cargo DIRETOR, o usuario `rowaizemarketing@gmail.com` tera acesso total de leitura e escrita via `can_manage_users()`.

### Arquivos a criar

- `src/hooks/useUserProfiles.ts`
- `src/hooks/useTeams.ts`
- `src/hooks/useGrupos.ts`

### Arquivos a modificar

- `src/pages/Configuracoes.tsx`
- `src/pages/Hub.tsx`
- `src/pages/Monitoramento.tsx`

### Dados a atualizar no banco

- `user_roles` — UPDATE role para `DIRETOR` onde user_id = `10c6d7c8-3fb5-4474-9442-2960e178bb0d`

