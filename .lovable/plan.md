

## Diagnóstico

O erro é claro nos logs:

```
invalid peer certificate: UnknownIssuer
```

A Evolution API está configurada com HTTPS (`https://evo-uc8k4ccscosws8ksk0gs8g4k.72.60.48.134.sslip.io`) mas usa um certificado SSL auto-assinado que o Deno (runtime das Edge Functions) rejeita. Isso não é um bug de código — é uma incompatibilidade de TLS.

O Deno, por segurança, não aceita certificados de emissores desconhecidos. Não há API estável no Deno para desabilitar verificação TLS em `fetch()`.

## Solução

Modificar o orchestrator para **auto-converter HTTPS para HTTP** na base_url quando a URL usa sslip.io ou IPs diretos (indicativo de ambiente sem certificado válido). Adicionalmente, criar um wrapper de fetch que tenta HTTPS primeiro e, se falhar com erro de certificado, faz fallback para HTTP.

## Plano de Implementação

### Arquivo: `supabase/functions/whatsapp-orchestrator/index.ts`

1. Criar uma função `safeFetch` que envolve `fetch` com lógica de fallback:
   - Tenta a requisição normalmente
   - Se falhar com erro contendo "invalid peer certificate", "UnknownIssuer", ou "certificate" → refaz a requisição trocando `https://` por `http://` na URL

2. Substituir todos os `fetch(...)` dentro do objeto `evo` por `safeFetch(...)` — isso cobre todas as chamadas à Evolution API (createInstance, deleteInstance, connect, disconnect, sendMessage, sendMedia, getGroups, setWebhook, connectionState, healthCheck)

### Detalhe técnico

```text
safeFetch(url, options):
  try:
    return fetch(url, options)
  catch (err):
    if err.message includes "certificate" or "UnknownIssuer":
      httpUrl = url.replace("https://", "http://")
      return fetch(httpUrl, options)
    throw err
```

Isso garante que:
- URLs com HTTPS válido continuam funcionando normalmente
- URLs com certificados auto-assinados (como sslip.io) fazem fallback automático para HTTP
- Nenhuma alteração de configuração necessária pelo usuário

### Arquivos modificados
| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/whatsapp-orchestrator/index.ts` | Adicionar `safeFetch` wrapper + substituir `fetch` por `safeFetch` em todas as chamadas do objeto `evo` |

