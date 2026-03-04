

## Plano: Corrigir Painel de Monitoramento — Ativar grupos e garantir sincronização em tempo real

### Diagnóstico Real

O problema **não** é falta de infraestrutura. O sistema já possui:
- Webhook (`whatsapp-webhook`) que recebe mensagens e atualiza `grupos.last_message`, `last_message_at`, `mensagens`
- Orchestrator com `sync-groups`, `get-chats`, etc.
- Hook `useGrupos` com polling de 15s
- Hook `useGroupConversations` com Realtime subscriptions
- Páginas Monitoramento, Squads e Hub já lendo da tabela `grupos`

**Causa raiz:** Todos os 398 grupos no banco estão com `ativo = false` e `instance_id = NULL`. O `useGrupos` filtra por `ativo = true`, resultando em lista vazia em todos os painéis.

### Por que NÃO criar novas tabelas

O plano enviado propõe criar `monitoring_records`, `whatsapp_groups`, `whatsapp_messages` — tabelas que duplicam o que já existe em `grupos`, `grupo_messages` e `whatsapp_message_log`. Isso quebraria toda a lógica existente nos 3 painéis e no Chat. A solução correta é corrigir os dados e ajustar o fluxo de sincronização.

### Correções a implementar

**1. Ativar todos os grupos existentes (SQL update)**
- `UPDATE grupos SET ativo = true WHERE ativo = false`
- São 398 grupos com dados reais (82 já têm `last_message_at`)

**2. Corrigir `sync-groups` no orchestrator para definir `ativo = true`**
- Quando o orchestrator sincroniza grupos, garantir que `ativo = true` e `instance_id` são preenchidos
- Atualmente o sync pode estar criando com `ativo = false`

**3. Hub.tsx — Remover fallback para mock data**
- O Hub ainda tem `MOCK_GRUPOS` como fallback quando `dbGrupos` está vazio
- Substituir por empty state igual ao do Monitoramento

**4. Garantir que webhook atualiza `ativo` corretamente**
- No `whatsapp-webhook`, ao receber mensagem de grupo que existe mas está `ativo = false`, reativá-lo

### Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | `UPDATE grupos SET ativo = true` |
| `supabase/functions/whatsapp-orchestrator/index.ts` | Garantir `ativo: true` no `sync-groups` |
| `supabase/functions/whatsapp-webhook/index.ts` | Reativar grupo ao receber mensagem |
| `src/pages/Hub.tsx` | Remover fallback mock, usar empty state real |

### Resultado esperado
- Painéis Global, Squad e Hub mostram os 398 grupos imediatamente
- `last_message_at` e `mensagens` já preenchidos aparecem nas colunas DATA/HORA e CONVERSAS
- Novas mensagens atualizam via webhook + polling de 15s

