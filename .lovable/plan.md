

## Plano: Corrigir duplicação e adicionar funcionalidades completas ao Chat

### Problemas identificados

1. **Mensagens duplicadas**: O `useSendMessage` invalida a query `whatsapp-chat-messages` após envio, que re-fetcha do servidor. Mas a mensagem enviada pode demorar a aparecer no `findMessages` da Evolution API, causando comportamento inconsistente. A solução é usar **optimistic update** — adicionar a mensagem localmente no cache imediatamente e não re-buscar.

2. **Falta de funcionalidades**: envio de mídia (fotos, vídeos, documentos, áudio), exclusão e edição de mensagens.

### Mudanças

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/whatsapp-orchestrator/index.ts` | Adicionar actions `delete-message` e `edit-message` usando endpoints da Evolution API v2 |
| `src/hooks/useWhatsAppMessages.ts` | Corrigir `useSendMessage` com optimistic update (sem invalidate), adicionar `useSendMedia` com invalidate no chat, adicionar `useDeleteMessage` e `useEditMessage` |
| `src/components/ChatTab.tsx` | Reescrever com: (1) optimistic send sem duplicação, (2) botão de anexo para mídia via URL, (3) menu de contexto em mensagens para editar/apagar, (4) renderização de tipos de mídia (imagem, vídeo, documento, áudio), (5) auto-refresh com `refetchInterval` |

### Detalhes técnicos

**Backend — novos endpoints Evolution API v2:**
- `DELETE /chat/deleteMessageForEveryone/{instance}` — body: `{ id, remoteJid, fromMe }`
- `POST /chat/updateMessage/{instance}` — body: `{ number, text, key: { remoteJid, fromMe, id } }`
- `POST /message/sendMedia/{instance}` — já existe mas precisa ajustar body para `{ number, mediatype, media, caption, fileName }`

**Frontend — correção de duplicação:**
- `useSendMessage`: usar `queryClient.setQueryData` para adicionar mensagem local imediatamente, sem `invalidateQueries`
- Adicionar `refetchInterval: 10_000` no `useChatMessages` para atualização automática de novas mensagens recebidas

**Frontend — envio de mídia:**
- Botão de anexo que abre input para URL de mídia + tipo (image/video/document/audio) + caption
- Usar `useSendMedia` existente, ajustado para invalidar cache de mensagens

**Frontend — editar/apagar:**
- Menu dropdown em cada mensagem enviada (fromMe) com opções "Editar" e "Apagar"
- Editar abre inline input, apagar com confirmação

