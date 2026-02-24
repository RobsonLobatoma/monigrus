

## Analise Completa da Integração Evolution API

### Problemas Identificados

Analisei os logs, banco de dados, webhook, orchestrator e analytics. Existem **3 problemas fundamentais** que impedem a conexao e sincronizacao de funcionar.

---

### Problema 1: Webhook nao configurado na Evolution API

A tabela `whatsapp_webhooks_log` esta **completamente vazia**. Isso significa que a Evolution API nunca enviou nenhum evento de volta para o Supabase. O fluxo esperado e:

```text
1. Usuario clica "Conectar" → orchestrator chama /instance/connect → retorna QR Code → status = "connecting"
2. Usuario escaneia QR → Evolution API envia evento "connection.update" via webhook → webhook function atualiza status = "connected"
3. Com status "connected", sync-groups funciona
```

O passo 2 nunca acontece porque **ninguem configurou a URL do webhook na Evolution API**. Quando a instancia e criada ou conectada, o orchestrator nao registra o webhook URL. A instancia fica presa em "connecting" eternamente.

**Correcao:** Ao criar a instancia (`create-instance`), chamar o endpoint da Evolution API para configurar o webhook apontando para `https://nmmbjptgrvsjqeytmxmw.supabase.co/functions/v1/whatsapp-webhook`. Tambem configurar ao conectar (`connect-instance`) como fallback.

---

### Problema 2: Status da instancia nunca atualiza para "connected"

Como consequencia do Problema 1, a instancia "robsonn" esta presa com `status: "connecting"` desde que foi criada. O `sync-groups` verifica `inst.status !== "connected"` e rejeita com erro.

**Correcao adicional:** Criar uma action `check-status` que consulta diretamente a Evolution API (`/instance/connectionState/{instanceName}`) e atualiza o banco. Isso serve como fallback caso o webhook falhe. A UI tambem deve chamar esse check periodicamente ou ao clicar em "Conectar".

---

### Problema 3: Evolution API possivelmente inacessivel

O ultimo log de erro do orchestrator mostra:
```
Orchestrator error: A Evolution API não respondeu dentro de 25 segundos. TimeoutError
```

A URL configurada e `http://evo-uc8k4ccscosws8ksk0gs8g4k.72.60.48.134.sslip.io` (HTTP, nao HTTPS). Supabase Edge Functions rodam na cloud e precisam acessar esse IP publicamente. Se `72.60.48.134` nao for um IP publico acessivel, o fetch sempre vai dar timeout.

**Porem**, existem chamadas que retornaram 200 (list-providers, get-instances, get-qr-code) com sucesso em ~400-900ms. Isso sugere que o servidor **as vezes** responde. O timeout de 25s pode nao ser suficiente para operacoes mais pesadas como `fetchAllGroups`, ou o servidor pode estar instavel.

**Correcao:** Nao ha correcao de codigo possivel para isso - depende da infraestrutura do usuario. Mas podemos melhorar o diagnostico adicionando logs e retornando informacoes mais claras.

---

### Plano de Correcao Definitivo

#### 1. Registrar webhook automaticamente ao criar/conectar instancia
**Arquivo:** `supabase/functions/whatsapp-orchestrator/index.ts`

Adicionar ao objeto `evo` um metodo `setWebhook` que chama `POST /webhook/set/{instanceName}` da Evolution API com a URL do webhook do Supabase:

```typescript
setWebhook: async (n: string, c: ProviderConfig, webhookUrl: string) => {
  await safeJson(await fetch(`${c.base_url}/webhook/set/${n}`, {
    method: "POST",
    headers: headers(c),
    body: JSON.stringify({
      url: webhookUrl,
      webhook_by_events: false,
      webhook_base64: false,
      events: [
        "connection.update",
        "qrcode.updated",
        "messages.upsert",
        "messages.update",
        "status.instance"
      ]
    }),
    signal: sig()
  }));
}
```

Chamar `evo.setWebhook()` dentro de `create-instance` e `connect-instance`, usando a URL:
`https://nmmbjptgrvsjqeytmxmw.supabase.co/functions/v1/whatsapp-webhook`

#### 2. Adicionar action `check-status` para polling direto
**Arquivo:** `supabase/functions/whatsapp-orchestrator/index.ts`

Nova action que consulta `/instance/connectionState/{instanceName}` e atualiza o status no banco:

```typescript
case "check-status": {
  const inst = await getInst(params.instanceId);
  const { config } = await resolveProvider(inst.provider_id);
  const d = await safeJson(await fetch(
    `${config.base_url}/instance/connectionState/${inst.instance_name}`,
    { headers: authOnly(config), signal: sig() }
  ));
  const state = d?.instance?.state || d?.state || "unknown";
  const statusMap: Record<string, string> = { open: "connected", close: "disconnected", connecting: "connecting" };
  const newStatus = statusMap[state] || "disconnected";
  await svc.from("whatsapp_instances").update({ status: newStatus }).eq("id", params.instanceId);
  if (newStatus === "connected") {
    await svc.from("whatsapp_instances").update({ qr_code: null }).eq("id", params.instanceId);
  }
  result = { state, status: newStatus };
  break;
}
```

#### 3. UI: Polling automatico de status e botao de verificar conexao
**Arquivos:** `src/hooks/useWhatsAppInstances.ts`, `src/pages/Conexoes.tsx`

- Adicionar hook `useCheckStatus` que chama a action `check-status`
- No fluxo de `handleConnect`, apos exibir o QR Code, iniciar um polling a cada 5 segundos chamando `check-status` ate o status mudar para "connected" (max 60s)
- Adicionar botao "Verificar Status" na lista de instancias

#### 4. UI: Apos status mudar para "connected", sincronizar automaticamente
**Arquivo:** `src/pages/Conexoes.tsx`

Quando o polling detectar que o status mudou para "connected", automaticamente disparar `syncGroups.mutate(instanceId)` e exibir toast de sucesso.

---

### Detalhes Tecnicos

**Mudancas no orchestrator (`whatsapp-orchestrator/index.ts`):**
- Novo metodo `evo.setWebhook()`
- `create-instance`: chamar `setWebhook` apos criar instancia
- `connect-instance`: chamar `setWebhook` apos conectar
- Novo case `check-status` para polling de estado

**Mudancas no hook (`useWhatsAppInstances.ts`):**
- Nova funcao `useCheckStatus` mutation
- Logica de polling com `setInterval` + cleanup

**Mudancas na pagina (`Conexoes.tsx`):**
- Polling automatico quando QR modal esta aberto
- Sync automatico quando status muda para "connected"
- Botao "Verificar Status" por instancia

**Nota importante:** O webhook URL do Supabase (`https://...supabase.co/functions/v1/whatsapp-webhook`) precisa estar acessivel pela Evolution API. Como a Evolution API roda no IP `72.60.48.134`, ela precisa ter acesso a internet para enviar eventos para o Supabase. Se estiver em rede interna sem acesso externo, os webhooks nunca chegarao.

