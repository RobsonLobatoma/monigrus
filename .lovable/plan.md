

## Diagnostico

Analisei os logs, o banco de dados e a documentacao da Evolution API v2. Encontrei **3 problemas criticos**:

### Problema 1: Webhook nunca foi registrado com sucesso
Os logs mostram: `[sync-groups] Webhook config for pessoa: null`

O codigo atual em `evo.setWebhook` envia:
```json
{
  "url": "...",
  "webhook_by_events": false,
  "webhook_base64": false,
  "events": [...]
}
```

A documentacao da Evolution API v2 exige o campo **`enabled: true`** como obrigatorio. Sem ele, o webhook nao eh ativado. Alem disso, os nomes dos campos devem ser `webhookByEvents` e `webhookBase64` (camelCase), nao snake_case.

### Problema 2: `findMessages` com filtro `remoteJid` nao funciona
O GitHub issue #1632 da Evolution API confirma que o endpoint `POST /chat/findMessages/{instance}` **nao filtra por remoteJid** — retorna array vazio ou ignora o filtro. Isso explica `Messages found: 0/93`.

### Problema 3: Tabelas `grupo_messages` e `whatsapp_webhooks_log` estao vazias
Zero registros em ambas. Consequencia direta do webhook nao estar registrado — nenhum evento jamais chegou ao backend.

---

## Plano de Implementacao

### ETAPA 1 — Corrigir registro do webhook na Evolution API

**Arquivo: `supabase/functions/whatsapp-orchestrator/index.ts`**

Modificar `evo.setWebhook` (linhas 85-103) para enviar o payload correto conforme a documentacao v2:

```text
Body correto:
{
  "enabled": true,          // OBRIGATORIO - campo faltando
  "url": webhookUrl,
  "webhookByEvents": false,  // camelCase, nao snake_case
  "webhookBase64": false,    // camelCase, nao snake_case
  "events": [
    "MESSAGES_UPSERT",       // Formato enum correto da v2
    "MESSAGES_UPDATE",
    "CONNECTION_UPDATE",
    "QRCODE_UPDATED"
  ]
}
```

### ETAPA 2 — Corrigir busca de mensagens durante sync

**Arquivo: `supabase/functions/whatsapp-orchestrator/index.ts`**

Substituir `evo.findLastMessage` (que usa `findMessages` com filtro remoteJid quebrado) por `evo.findChats`:

```text
evo.findChats(instanceName, config):
  POST /chat/findChats/{instanceName}
  body: {}
  Retorna array de chats, cada um com lastMessage e remoteJid
  
sync-groups modificado:
  1. Chamar evo.findChats UMA VEZ (em vez de 93 chamadas individuais)
  2. Criar mapa: remoteJid → lastMessage
  3. Para cada grupo sincronizado, buscar a mensagem no mapa
  4. Atualizar last_message e last_message_at
```

Isso resolve performance (1 chamada vs 93) e o bug do filtro.

### ETAPA 3 — Corrigir o webhook handler para o formato real da Evolution API v2

**Arquivo: `supabase/functions/whatsapp-webhook/index.ts`**

O webhook atual extrai `body.event` mas a Evolution API v2 envia o evento no campo `body.event` com formato diferente. Ajustar:

```text
Payload real da Evolution v2:
{
  "event": "messages.upsert",
  "instance": "pessoa",
  "data": {
    "key": { "remoteJid": "...", "fromMe": false, "id": "..." },
    "pushName": "Nome",
    "message": { "conversation": "texto" },
    "messageType": "conversation",
    "messageTimestamp": 1234567890
  }
}

Ajustes:
1. Extrair instanceName de body.instance (string direta, nao body.instance.instanceName)
2. Tratar body.data como objeto unico (nao array)
3. Usar messageTimestamp para received_at
```

### ETAPA 4 — Registrar webhook automaticamente ao conectar instancia

Ja existe a chamada `evo.setWebhook` no `create-instance` e `connect-instance`. Com o fix do payload (ETAPA 1), o webhook passara a ser registrado corretamente.

Adicionar tambem ao `sync-groups`: se o webhook nao estiver configurado, registra-lo automaticamente.

### ETAPA 5 — Garantir que a Monitoramento exiba mensagens em tempo real

**Arquivo: `src/pages/Monitoramento.tsx`**

O codigo na linha 177 ja usa `(g as any).last_message || "Sem mensagens"` — isso funcionara automaticamente quando o webhook comecar a popular `last_message` na tabela `grupos`.

Nenhuma mudanca necessaria no frontend.

---

## Detalhe tecnico

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/whatsapp-orchestrator/index.ts` | Fix `evo.setWebhook` com `enabled: true` e campos camelCase; substituir `evo.findLastMessage` por `evo.findChats` (1 chamada vs 93); auto-registrar webhook no sync-groups |
| `supabase/functions/whatsapp-webhook/index.ts` | Corrigir extracao de `instanceName` do payload v2; tratar `data` como objeto unico |

## Resultado esperado

1. Webhook sera registrado com sucesso na Evolution API
2. Mensagens chegam em tempo real via webhook → `grupo_messages` + `grupos.last_message`
3. `findChats` popula `last_message` durante sync para mensagens pre-existentes
4. Coluna "CONVERSAS" exibe mensagens reais
5. Metricas de mensagens passam a funcionar

