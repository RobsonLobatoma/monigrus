

## Diagnóstico do Erro 307

O erro `Non-JSON (307): Temporary Redirect` ocorre porque o `safeFetch` está excessivamente complexo com `redirect: "manual"` + `handleRedirect`. O fluxo atual:

1. `resolveProvider` converte `https://...sslip.io` → `http://...sslip.io`
2. `safeFetch` faz fetch com `redirect: "manual"` → servidor retorna 307
3. `handleRedirect` tenta seguir o redirect para HTTPS → mas a resposta do HTTPS TAMBÉM pode ser um 307 (para outro path/trailing slash), e esse segundo redirect não é tratado
4. `safeJson` recebe o Response com status 307 e body "Temporary Redirect" → erro

**A solução é simplificar `safeFetch` drasticamente**: usar `redirect: "follow"` como padrão e só tratar erros de TLS como fallback.

---

## Sobre o Prompt Extenso

O projeto **já possui** a maioria da infraestrutura solicitada:
- ✅ Edge Function `whatsapp-orchestrator` com todas as ações (create, delete, connect, disconnect, sync, QR, webhooks, health-check)
- ✅ Tabelas `whatsapp_instances`, `whatsapp_providers`, `whatsapp_message_log`, `whatsapp_webhooks_log`, `grupos`, `tags` com RLS
- ✅ Hooks React Query (`useWhatsAppInstances`, `useWhatsAppProviders`, `useTags`, etc.)
- ✅ Página Conexões com 5 tabs (Instâncias, Providers, Tags, Logs, Webhooks)
- ✅ QR Code modal com polling
- ✅ Sync de grupos em batch

Reescrever tudo do zero com uma arquitetura diferente (classes, factory pattern, tabelas com user_id em vez de organization_id) **quebraria** o sistema funcional existente. O plano foca no que realmente precisa ser corrigido.

---

## Plano de Implementação

### Arquivo: `supabase/functions/whatsapp-orchestrator/index.ts`

**Mudança única**: Simplificar `safeFetch` e eliminar `handleRedirect`:

```text
async function safeFetch(url: string | URL | Request, init?: RequestInit): Promise<Response> {
  const urlStr = String(url);
  const timeout = init?.signal ? undefined : AbortSignal.timeout(FETCH_TIMEOUT);
  const baseInit: RequestInit = { ...init, signal: init?.signal || timeout, redirect: "follow" };

  try {
    return await fetch(urlStr, baseInit);
  } catch (err: any) {
    const msg = err?.message || "";
    // TLS error → fallback to HTTP
    if (msg.includes("certificate") || msg.includes("UnknownIssuer") || msg.includes("tls") || msg.includes("SSL")) {
      const httpUrl = urlStr.replace("https://", "http://");
      console.log(`[safeFetch] TLS error, fallback HTTP: ${httpUrl}`);
      return await fetch(httpUrl, baseInit);
    }
    throw err;
  }
}
```

Isto:
1. Usa `redirect: "follow"` — Deno segue automaticamente 301, 302, 307, 308
2. Se TLS falha, tenta HTTP com `redirect: "follow"` — o servidor pode redirecionar de volta para HTTPS com cert válido e o Deno segue
3. Remove toda a complexidade de `handleRedirect`, `tryFetch`, `redirect: "manual"`

A função `handleRedirect` inteira é removida.

---

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/whatsapp-orchestrator/index.ts` | Simplificar `safeFetch` para ~10 linhas, remover `handleRedirect` |

## Resultado esperado

1. Todas as chamadas à Evolution API seguem redirects automaticamente
2. Fallback HTTP→HTTPS funciona sem loop de redirects
3. Sem mais erros "Non-JSON (307)"

