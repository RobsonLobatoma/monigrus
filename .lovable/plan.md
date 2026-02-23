

## Plano: Camada de Integracao WhatsApp com Arquitetura Modular

### Visao Geral

Criar uma camada de abstracao completa para integracao WhatsApp, usando Edge Functions do Supabase como backend, tabelas para configuracao dinamica de providers, e uma pagina de gestao no frontend. A Evolution API sera o primeiro provider implementado.

### Arquitetura

```text
Frontend (React)
      |
      v
Supabase Edge Functions
      |
      v
Orchestrator (whatsapp-orchestrator)
      |
      v
Provider Adapter (whatsapp-provider-evolution)
      |
      v
Evolution API
```

Todo o codigo novo sera aditivo -- zero alteracoes em arquivos existentes exceto adicionar rotas e links de navegacao.

---

### Etapa 1 -- Tabelas no Banco de Dados

**Tabela `whatsapp_providers`** -- Registro de providers disponiveis:
- `id` (uuid PK)
- `name` (text, unique) -- ex: "evolution", "cloudapi", "zapi"
- `display_name` (text) -- ex: "Evolution API"
- `is_active` (boolean, default false)
- `is_default` (boolean, default false)
- `config` (jsonb, default '{}') -- base_url, api_key_secret_name, etc.
- `created_at`, `updated_at`

**Tabela `whatsapp_instances`** -- Instancias conectadas:
- `id` (uuid PK)
- `provider_id` (uuid FK -> whatsapp_providers)
- `instance_name` (text)
- `phone_number` (text nullable)
- `status` (text: "disconnected", "connecting", "connected", "error")
- `qr_code` (text nullable)
- `session_data` (jsonb, default '{}')
- `last_health_check` (timestamptz nullable)
- `created_at`, `updated_at`

**Tabela `whatsapp_message_log`** -- Log de mensagens enviadas/recebidas:
- `id` (uuid PK)
- `instance_id` (uuid FK -> whatsapp_instances)
- `direction` (text: "inbound", "outbound")
- `message_type` (text: "text", "media", "document")
- `payload` (jsonb)
- `status` (text: "queued", "sent", "delivered", "failed")
- `error_message` (text nullable)
- `latency_ms` (integer nullable)
- `created_at`

**Tabela `whatsapp_webhooks_log`** -- Log de eventos de webhook:
- `id` (uuid PK)
- `instance_id` (uuid FK -> whatsapp_instances nullable)
- `event_type` (text)
- `payload` (jsonb)
- `processed` (boolean, default false)
- `created_at`

RLS: leitura e escrita para `can_manage_users()`. Seed com provider "evolution" (is_default = true, is_active = true).

---

### Etapa 2 -- Edge Functions (Backend)

**2a. `whatsapp-orchestrator/index.ts`** -- Ponto de entrada unico

Recebe todas as chamadas do frontend via `supabase.functions.invoke('whatsapp-orchestrator', { body: { action, ...params } })`.

Actions suportadas:
- `list-providers` -- lista providers da tabela
- `set-active-provider` -- ativa/desativa provider
- `create-instance` -- cria instancia
- `delete-instance` -- remove instancia
- `connect-instance` -- inicia conexao (gera QR)
- `disconnect-instance` -- desconecta
- `get-qr-code` -- busca QR code
- `send-message` -- envia mensagem
- `send-media` -- envia midia
- `get-groups` -- lista grupos do WhatsApp
- `health-check` -- verifica saude do provider
- `get-instances` -- lista instancias
- `get-message-log` -- busca logs

O orchestrator:
1. Identifica o provider ativo (da tabela ou do parametro)
2. Delega para o adapter correto
3. Normaliza a resposta
4. Registra logs na tabela `whatsapp_message_log`
5. Implementa retry com backoff exponencial (max 3 tentativas)

**2b. Provider Interface (dentro do orchestrator)**

```text
Interface WhatsAppProvider:
  connect(instanceId, config) -> { qrCode?, status }
  disconnect(instanceId, config) -> { success }
  sendMessage(instanceId, config, payload) -> { messageId, status }
  sendMedia(instanceId, config, payload) -> { messageId, status }
  getGroups(instanceId, config) -> { groups[] }
  healthCheck(config) -> { healthy, latency }
```

Cada provider e um arquivo separado importado pelo orchestrator.

**2c. `whatsapp-orchestrator/providers/evolution.ts`** -- Adapter Evolution API

Implementa a interface acima usando a Evolution API:
- POST `/instance/create` -- criar instancia
- GET `/instance/connect/{instance}` -- obter QR
- POST `/message/sendText/{instance}` -- enviar texto
- POST `/message/sendMedia/{instance}` -- enviar midia
- GET `/group/fetchAllGroups/{instance}` -- listar grupos
- DELETE `/instance/delete/{instance}` -- remover

A base_url e a apikey vem da config do provider (tabela) + secret do Supabase.

**2d. `whatsapp-webhook/index.ts`** -- Receptor de webhooks

Edge function com `verify_jwt = false` para receber callbacks da Evolution API:
- Valida HMAC signature (se configurado)
- Registra evento em `whatsapp_webhooks_log`
- Atualiza status da instancia quando necessario
- Processa mensagens recebidas

---

### Etapa 3 -- Hooks React (Frontend)

**`src/hooks/useWhatsAppProviders.ts`**
- `useWhatsAppProviders()` -- lista providers
- `useActivateProvider()` -- ativa/desativa

**`src/hooks/useWhatsAppInstances.ts`**
- `useWhatsAppInstances()` -- lista instancias
- `useCreateInstance()` -- cria
- `useDeleteInstance()` -- remove
- `useConnectInstance()` -- conecta (retorna QR)
- `useDisconnectInstance()` -- desconecta

**`src/hooks/useWhatsAppMessages.ts`**
- `useSendMessage()` -- envia mensagem
- `useMessageLog()` -- busca logs

---

### Etapa 4 -- Pagina de Conexoes (Frontend)

**`src/pages/Conexoes.tsx`** -- Substituir a pagina placeholder atual

Tabs:
1. **Instancias** -- Lista de instancias WhatsApp com status, botoes conectar/desconectar, exibicao de QR code
2. **Providers** -- Lista de providers disponiveis, toggle ativo/inativo, configuracao (base URL)
3. **Logs** -- Tabela de mensagens enviadas/recebidas com filtros
4. **Webhooks** -- Log de eventos recebidos

Cada instancia mostra:
- Nome, telefone, status (badge colorido)
- Botao "Conectar" que exibe QR code em modal
- Botao "Desconectar"
- Botao "Testar" (envia health check)
- Botao "Grupos" (lista grupos do WhatsApp)

---

### Etapa 5 -- Navegacao

- Atualizar `src/App.tsx`: apontar rota `/conexoes` para o novo componente `Conexoes`
- Nenhuma alteracao no sidebar (ja existe o item "Conexoes")

---

### Detalhes Tecnicos

**Arquivos a criar:**

| Arquivo | Descricao |
|---|---|
| `supabase/functions/whatsapp-orchestrator/index.ts` | Orchestrator central |
| `supabase/functions/whatsapp-webhook/index.ts` | Receptor de webhooks |
| `src/hooks/useWhatsAppProviders.ts` | Hook CRUD providers |
| `src/hooks/useWhatsAppInstances.ts` | Hook CRUD instancias |
| `src/hooks/useWhatsAppMessages.ts` | Hook mensagens e logs |
| `src/pages/Conexoes.tsx` | Pagina completa de gestao |

**Arquivos a modificar:**

| Arquivo | O que muda |
|---|---|
| `src/App.tsx` | Importar e rotear Conexoes.tsx (linha 40) |
| `supabase/config.toml` | Adicionar config das 2 edge functions |

**Migracao SQL:**
- Uma migracao criando as 4 tabelas + RLS + seed do provider Evolution + triggers updated_at

**Secrets necessarios:**
- `EVOLUTION_API_KEY` -- chave da Evolution API (sera solicitada ao usuario antes da implementacao)

**Garantias:**
- Zero alteracao em funcionalidades existentes
- Zero remocao de codigo
- Zero alteracao de layout
- Arquitetura totalmente desacoplada e plugavel

