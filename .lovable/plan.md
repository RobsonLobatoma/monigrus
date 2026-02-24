

## Diagnóstico

Consultei a documentação da Evolution API v2. Os endpoints usados no orchestrator estão corretos:
- `GET /group/fetchAllGroups/{instance}` com header `apikey`
- `GET /instance/fetchInstances` com header `apikey`
- `GET /instance/connectionState/{instance}` com header `apikey`

O problema **não é de endpoint**. O problema é que a conexão HTTPS com o domínio `sslip.io` **fica pendurada** (hang) por 45 segundos até o `AbortSignal.timeout` disparar. O erro de certificado TLS nunca é lançado como exceção porque o timeout mata a requisição antes. Por isso o `safeFetch` nunca chega ao bloco `catch` com a mensagem "certificate" -- ele recebe `TimeoutError` em vez disso.

A prova: chamadas que não tocam a Evolution API (como `list-providers`, `get-instances`) retornam 200 em milissegundos. Apenas `sync-groups` (que chama `evo.getGroups` via HTTPS) dá timeout.

## Solução

Em vez de depender do fallback reativo (que nunca é acionado porque o timeout vem primeiro), converter proativamente HTTPS para HTTP na função `resolveProvider` quando a URL contém padrões indicativos de certificados inválidos (`sslip.io`, IPs diretos).

## Plano de Implementação

### Arquivo: `supabase/functions/whatsapp-orchestrator/index.ts`

1. Na função `resolveProvider`, após extrair `baseUrl`, adicionar lógica para detectar URLs com `sslip.io` ou padrões de IP e converter `https://` para `http://` automaticamente:

```text
resolveProvider:
  baseUrl = (row.config).base_url.replace(/\/+$/, "")
  
  // Novo: converter HTTPS → HTTP para domínios com certificados auto-assinados
  if (baseUrl.startsWith("https://")) {
    const hostname = new URL(baseUrl).hostname
    if (hostname.includes("sslip.io") || hostname.includes("nip.io") || /\d+\.\d+\.\d+\.\d+/.test(hostname)) {
      baseUrl = baseUrl.replace("https://", "http://")
      console.log("[resolveProvider] Auto-converted to HTTP:", baseUrl)
    }
  }
```

2. Manter o `safeFetch` existente como segunda camada de proteção para outros cenários de TLS inesperados.

### Resultado esperado
- A URL `https://evo-uc8k4ccscosws8ksk0gs8g4k.72.60.48.134.sslip.io` será automaticamente convertida para `http://evo-uc8k4ccscosws8ksk0gs8g4k.72.60.48.134.sslip.io`
- Todas as chamadas à Evolution API usarão HTTP diretamente, sem tentativa de TLS
- Sem timeout, sem hang, sem necessidade de fallback
- O `safeFetch` continua como rede de segurança para URLs HTTPS legítimas que falhem

### Arquivos modificados
| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/whatsapp-orchestrator/index.ts` | Adicionar auto-conversão HTTPS→HTTP no `resolveProvider` para domínios sslip.io/nip.io/IP |

