

## Diagnóstico

O erro "Organização não encontrada" ocorre porque o usuário logado **não tem registro na tabela `organization_members`**. O hook `useTags.ts` → `getOrgId()` faz query nessa tabela e falha.

Apenas 1 usuário (de 3) tem registro em `organization_members`. A organização existe (`5169da33-e0bb-4ddb-b5d3-9fc03197f97f`), mas os outros usuários não foram vinculados.

## Plano

### 1. Corrigir `useTags.ts` — fallback resiliente para `getOrgId`

Alterar `getOrgId()` para:
1. Primeiro tentar `organization_members` (como hoje)
2. Se não encontrar, usar a função RPC `user_org_ids` do Supabase
3. Se ainda não encontrar, buscar a organização única existente e **criar automaticamente** o registro em `organization_members` para o usuário

### 2. Garantir membership futura — migration SQL

Criar migration que:
- Insere em `organization_members` todos os usuários de `auth.users` que ainda não têm registro
- Atualiza o trigger `handle_new_user` para também criar o registro em `organization_members` automaticamente

Isso resolve o problema na raiz, garantindo que novos usuários já terão a associação.

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useTags.ts` | Tornar `getOrgId` resiliente com fallback |
| Migration SQL | Vincular usuários existentes + atualizar trigger |

