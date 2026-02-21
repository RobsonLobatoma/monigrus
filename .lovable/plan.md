

## Sistema Enterprise RBAC - Plano de Implementacao

### Resumo

Implementar controle de acesso baseado em cargos (RBAC) no frontend e backend, com novas tabelas para permissoes granulares e historico de squads, um hook central `useCurrentUserRole` para determinar o cargo do usuario logado, e filtragem de visibilidade em todas as telas -- sem alterar nenhum layout, menu ou funcionalidade existente.

---

### Etapa 1 -- Novas tabelas no banco de dados (migracao)

Criar 3 novas tabelas sem alterar nenhuma tabela existente:

| Tabela | Descricao |
|---|---|
| `permissions` | Lista de codigos de permissao (ex: `CREATE_USER`, `EDIT_SQUAD`, `VIEW_DASHBOARD_GLOBAL`) |
| `role_permissions` | Mapeamento entre `app_role` e permissoes |
| `user_squad_history` | Historico de movimentacao de usuarios entre squads |

```text
permissions:
  id (uuid PK), code (text UNIQUE), description (text), module (text), created_at

role_permissions:
  id (uuid PK), role (app_role), permission_id (uuid FK -> permissions.id), created_at
  UNIQUE(role, permission_id)

user_squad_history:
  id (uuid PK), user_id (uuid), old_team_id (uuid NULL), new_team_id (uuid NULL),
  changed_by (uuid), reason (text), created_at
```

RLS: leitura para autenticados, escrita para `can_manage_users()`.

Seed inicial com as permissoes da matriz de acesso:

| Codigo | Diretor | Gerente | Supervisor | Operacional |
|---|---|---|---|---|
| CREATE_USER | sim | sim | nao | nao |
| EDIT_USER | sim | sim | squad | nao |
| CREATE_SQUAD | sim | sim | nao | nao |
| EDIT_SQUAD | sim | sim | proprio | nao |
| MANAGE_PERMISSIONS | sim | nao | nao | nao |
| VIEW_DASHBOARD_GLOBAL | sim | sim | nao | nao |
| VIEW_DASHBOARD_SQUAD | sim | sim | sim | nao |
| EXECUTE_TASKS | nao | nao | gestao | sim |
| VIEW_MONITORAMENTO | sim | sim | sim | nao |
| VIEW_HUB | sim | nao | sim | sim |
| VIEW_ANOMALIAS | sim | sim | nao | nao |
| VIEW_CONEXOES | sim | sim | nao | nao |
| VIEW_CONFIGURACOES | sim | sim | sim | sim |

### Etapa 2 -- Hook useCurrentUserRole

Criar `src/hooks/useCurrentUserRole.ts`:
- Busca o cargo do usuario logado via `user_roles` + `useAuth()`
- Retorna `{ role, level, loading, canManage, hasPermission }`
- `level`: DIRETOR=1, GERENTE=2, SUPERVISOR=3, OPERACIONAL=4
- `canManage(targetLevel)`: verifica se pode gerenciar cargo abaixo
- `hasPermission(code)`: consulta `role_permissions` via cache

### Etapa 3 -- Hook usePermissions

Criar `src/hooks/usePermissions.ts`:
- `usePermissions()`: busca todas as permissoes + role_permissions
- `useCheckPermission(code)`: retorna boolean para o usuario atual
- Usa React Query com cache para evitar re-fetches

### Etapa 4 -- Hook useSquadHistory

Criar `src/hooks/useSquadHistory.ts`:
- `useSquadHistory(userId?)`: busca historico de movimentacao
- `useLogSquadChange()`: mutation para registrar mudanca de squad

### Etapa 5 -- Configuracoes.tsx (modificacao sem alterar layout)

Alteracoes internas, mantendo todos os elementos visuais identicos:

**Usuarios & Cargos:**
- Dropdown de "Cargo" no modal de criacao: filtrar opcoes para mostrar apenas cargos abaixo do nivel do usuario logado
- Validacao: `if (cargoNovoLevel <= cargoAtualLevel) BLOQUEAR`
- Botoes de editar/excluir: ocultos se usuario nao tem permissao

**Gestao de Squads:**
- Supervisor: filtrar dados por squad se o usuario logado for SUPERVISOR
- Botao "Novo Squad": visivel apenas para DIRETOR e GERENTE
- Botoes editar/excluir: SUPERVISOR so edita o proprio squad

**Gestao de Grupos:**
- SUPERVISOR ve apenas grupos do seu squad
- OPERACIONAL ve apenas grupos aos quais esta vinculado

**Hierarquia & Permissoes:**
- Matriz de Acessos: checkboxes editaveis apenas para DIRETOR (atualmente ja readonly para outros)
- GERENTE: nao ve permissoes do DIRETOR

**Visao Geral:**
- Cards de metricas: contagem dinamica baseada nos dados visiveis ao cargo do usuario

### Etapa 6 -- AppSidebar.tsx (modificacao sem alterar layout)

- Importar `useCurrentUserRole`
- Filtrar `navItems` baseado nas permissoes do usuario:
  - OPERACIONAL: nao ve Anomalias, Conexoes, Monitoramento (global)
  - SUPERVISOR: nao ve Anomalias, Conexoes
  - GERENTE: nao ve Hub
  - DIRETOR: ve tudo
- Itens de menu mantidos no array original, apenas filtrados via `.filter()`

### Etapa 7 -- Monitoramento.tsx (modificacao sem alterar layout)

- Importar `useCurrentUserRole`
- SUPERVISOR: filtrar `data` para mostrar apenas grupos do seu squad (via `team_id`)
- OPERACIONAL: redirecionar para `/` (nao tem acesso)
- DIRETOR/GERENTE: sem alteracao (ve tudo)

### Etapa 8 -- Hub.tsx (modificacao sem alterar layout)

- Importar `useCurrentUserRole`
- GERENTE: redirecionar para `/`
- SUPERVISOR: filtrar por squad
- Greeting dinamico: usar nome real do usuario logado em vez de "Dr. Ricardo"

---

### Arquivos a criar

| Arquivo | Descricao |
|---|---|
| `src/hooks/useCurrentUserRole.ts` | Hook central de cargo e permissoes do usuario logado |
| `src/hooks/usePermissions.ts` | Hook para consulta de permissoes granulares |
| `src/hooks/useSquadHistory.ts` | Hook para historico de movimentacao de squads |

### Arquivos a modificar

| Arquivo | O que muda |
|---|---|
| `src/pages/Configuracoes.tsx` | Validacao de cargo na criacao, filtragem por permissao, registro de historico |
| `src/pages/Hub.tsx` | Filtragem por cargo, greeting dinamico |
| `src/pages/Monitoramento.tsx` | Filtragem por squad para supervisor |
| `src/components/AppSidebar.tsx` | Filtragem de itens de menu por permissao |

### Migracao de banco de dados

Uma unica migracao SQL criando as 3 novas tabelas + seed de permissoes + RLS policies.

### Garantias

- Zero alteracao em tabelas existentes (`user_roles`, `teams`, `grupos`, `user_profiles`)
- Zero alteracao de layout visual
- Zero remocao de funcionalidades ou menus
- Toda logica nova e aditiva e desacoplada
- Fallback para dados mockados mantido
- Backward-compatible: se o hook de role nao carregar, comportamento padrao e mantido

