

## Plano: Corrigir atualização em tempo real do Painel de Monitoramento

### Problema
O Supabase Realtime respeita as políticas RLS. A tabela `grupos` usa políticas **restrictivas** (não permissivas), o que pode impedir que eventos Realtime sejam entregues ao cliente. Além disso, o `useGrupos` não tem polling como fallback.

### Solução (duas camadas)

**1. Adicionar `refetchInterval` ao `useGrupos` (polling de 15s)**

No `src/hooks/useGrupos.ts`, adicionar `refetchInterval: 15_000` à query `useGrupos`. Isso garante que mesmo sem Realtime, os dados atualizam a cada 15 segundos.

**2. Melhorar o hook `useGroupConversations` para escutar UPDATE explicitamente**

No `src/hooks/useGroupConversations.ts`, garantir que o canal escuta eventos `UPDATE` na tabela `grupos` (que é o que o webhook e o orchestrator fazem — update de `last_message`, `last_message_at`). Já está com `event: "*"`, então isso deveria funcionar, mas vamos adicionar um `refetchInterval` como mecanismo principal e manter o Realtime como bônus.

### Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useGrupos.ts` | Adicionar `refetchInterval: 15_000` |
| `src/hooks/useGroupConversations.ts` | Adicionar log de debug e garantir re-subscribe em caso de desconexão |

