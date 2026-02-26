

## Plano: Aba "Chat" na página Conexões

### Visão geral
Adicionar uma aba "Chat" à página de Conexões que exibe todas as conversas da Evolution API, permitindo visualizar mensagens e enviar/receber em tempo real.

### Componentes necessários

#### 1. Backend — Nova action `get-chats` no orchestrator
- Adicionar action `get-chats` que chama `evo.findChats(instanceName, config)` para retornar todas as conversas de uma instância
- Adicionar action `find-messages` que chama o endpoint `chat/findMessages/{instance}` da Evolution API para buscar mensagens de uma conversa específica (por `remoteJid`)

#### 2. Backend — Nova action `find-messages` no orchestrator
- Endpoint: `POST /chat/findMessages/{instanceName}` com body `{ where: { key: { remoteJid } } }`
- Retorna array de mensagens ordenadas por timestamp

#### 3. Hook frontend — `useWhatsAppMessages.ts`
- Adicionar `useChats(instanceId)` — lista de conversas via action `get-chats`
- Adicionar `useChatMessages(instanceId, remoteJid)` — mensagens de uma conversa específica via action `find-messages`
- Já existe `useSendMessage()` — será reutilizado para enviar mensagens

#### 4. Componente frontend — Aba Chat em `Conexoes.tsx`
Layout de chat em duas colunas:
- **Esquerda**: lista de conversas (contatos/grupos) com busca, mostrando nome, última mensagem e timestamp
- **Direita**: painel de mensagens da conversa selecionada com input de texto para envio

```text
┌─────────────────────────────────────────────────┐
│ [Selector de Instância]                         │
├──────────────┬──────────────────────────────────┤
│ 🔍 Buscar... │  Nome do contato/grupo           │
│              │                                  │
│ Contato 1    │  ┌─────────────────────────┐     │
│ Contato 2 ◀─│  │ mensagem recebida       │     │
│ Grupo 1      │  │         mensagem enviada│     │
│ Grupo 2      │  │ mensagem recebida       │     │
│              │  └─────────────────────────┘     │
│              │  [  Digite sua mensagem... ] [➤] │
├──────────────┴──────────────────────────────────┤
```

### Detalhes técnicos

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/whatsapp-orchestrator/index.ts` | Adicionar actions `get-chats` e `find-messages` |
| `src/hooks/useWhatsAppMessages.ts` | Adicionar hooks `useChats` e `useChatMessages` |
| `src/pages/Conexoes.tsx` | Adicionar aba "Chat" com UI de duas colunas |

### Fluxo
1. Usuário seleciona instância conectada no dropdown
2. Sistema busca todas as conversas via `findChats`
3. Usuário clica numa conversa → carrega mensagens via `findMessages`
4. Usuário digita mensagem → envia via `send-message` (já existente)
5. Supabase Realtime no `grupo_messages` atualiza mensagens recebidas automaticamente

