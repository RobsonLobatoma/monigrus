

## Plano: Correção definitiva do Chat WhatsApp

### 1. Normalização de JID no orchestrator (`get-chats` e `find-messages`)

Criar função `normalizeJid(jid)` no orchestrator que:
- Remove `@s.whatsapp.net`, `@lid`, `@c.us`
- Extrai número real de `remoteJid`, `participant`, `author`
- Para contatos (não grupos), padroniza para formato E.164 (`55XXXXXXXXXXX`)
- Deduplicar chats no `get-chats`: agrupar por número normalizado, manter o mais recente

### 2. Nomes de grupos e contatos no `get-chats`

- Para grupos (`@g.us`): adicionar chamada `fetchGroupMetadataOnDemand` usando endpoint `group/fetchAllGroups/{instance}` (já implementado em `evo.getGroups`) e fazer cache no response
- Para contatos sem nome: usar `pushName` do `lastMessage` ou formatar o número como fallback legível (`+55 98 84970-654`)

### 3. Fotos de perfil — nova action `get-profile-picture`

Adicionar action no orchestrator:
- Endpoint: `GET /chat/fetchProfilePictureUrl/{instance}?number={jid}`
- Retorna URL da foto de perfil
- Frontend: novo componente `ContactAvatar` que busca foto via hook com cache em `Map` local

### 4. Frontend — `ContactAvatar` component

- Substitui o `AvatarFallback` atual no ChatTab
- Busca foto de perfil via `get-profile-picture` action
- Cache em memória (Map) com TTL de 30min
- Fallback visual: iniciais do nome ou ícone de grupo

### 5. Frontend — Deduplicação no `get-chats` response

- No orchestrator, após normalizar JIDs, agrupar conversas pelo mesmo número
- Manter apenas a entrada com timestamp mais recente
- Garantir que `find-messages` aceita o JID original para buscar mensagens corretamente

### Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/whatsapp-orchestrator/index.ts` | Função `normalizeJid()`, dedup em `get-chats`, action `get-profile-picture` |
| `src/components/chat/ContactAvatar.tsx` | Novo componente com fetch de foto + cache |
| `src/components/ChatTab.tsx` | Usar `ContactAvatar`, exibir nomes formatados |

### Fora de escopo (requer infra adicional)
- Job recorrente de reprocessamento (requer pg_cron + endpoint dedicado)
- Merge de histórico no banco (não há histórico persistido no DB para chats diretos, apenas `grupo_messages`)
- Cache persistente de fotos (requer storage bucket)

