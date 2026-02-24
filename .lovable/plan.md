

## Analise do Codigo Colado e Diagnostico do Problema Real

### Problemas no codigo colado

O codigo que voce colou tem varios bugs criticos:

1. **Codigo duplicado no escopo global** - O bloco `INSECURE_HOST_PATTERNS` + `isIpAddress` + `if (baseUrl...)` aparece duas vezes: uma dentro de `resolveProvider` (correto) e outra solta no escopo do modulo (erro de sintaxe - `baseUrl` nao existe nesse contexto)
2. **Sem CORS headers** - Requisicoes do browser serao bloqueadas
3. **Sem autenticacao** - Qualquer pessoa pode chamar a funcao
4. **Sem integracao com Supabase** - Nao lê providers/instances do banco, nao persiste dados
5. **Arquitetura incompativel** - O codigo colado eh uma funcao completamente diferente do orchestrator atual que ja funciona para check-status, create-instance, etc.

**Esse codigo NAO deve substituir o orchestrator atual.** O orchestrator existente no projeto eh muito mais completo e a conversao HTTPS→HTTP ja esta implementada nele.

### O problema real

Analisando os logs, o `check-status` funciona perfeitamente apos a conversao HTTP:
```
[resolveProvider] Auto-converted to HTTP: http://evo-uc8k4ccscosws8ksk0gs8g4k.72.60.48.134.sslip.io
[check-status] Instance robson: state=open, prevStatus=connected
```

Mas `sync-groups` e `get-groups` ainda dao timeout de 45 segundos. Isso indica que:

1. A conversao HTTP funciona (check-status prova isso)
2. O endpoint `/group/fetchAllGroups` especificamente nao responde ou o servidor Coolify redireciona HTTP→HTTPS para certas rotas, causando o hang TLS novamente

### Causa raiz provavel

O servidor Coolify provavelmente tem um redirect HTTP→HTTPS configurado. O `fetch` do Deno segue redirects automaticamente por padrao. Entao:

```text
1. fetch("http://...sslip.io/group/fetchAllGroups/robson")
2. Servidor responde 301 → https://...sslip.io/group/fetchAllGroups/robson
3. fetch segue o redirect para HTTPS
4. TLS handshake trava (certificado invalido)
5. Timeout apos 45 segundos
```

O `connectionState` funciona porque eh leve e pode completar antes do redirect, ou o path nao tem redirect.

## Plano de Implementacao

### Arquivo: `supabase/functions/whatsapp-orchestrator/index.ts`

**Mudanca 1**: Modificar `safeFetch` para usar `redirect: "manual"` e interceptar redirects HTTPS→HTTP automaticamente:

```text
safeFetch(url, init):
  // Adicionar redirect: "manual" para impedir que fetch siga redirects HTTPS
  response = fetch(url, { ...init, redirect: "manual" })
  
  // Se receber redirect (301/302/307/308), verificar se destino eh HTTPS
  if (response.status >= 300 && response.status < 400):
    location = response.headers.get("location")
    if (location starts with "https://" AND url starts with "http://"):
      // Converter destino do redirect de volta para HTTP
      httpLocation = location.replace("https://", "http://")
      return fetch(httpLocation, { ...init, redirect: "manual" })
  
  return response
```

**Mudanca 2**: Adicionar log de diagnostico na chamada `getGroups` para confirmar a URL final usada:

```text
evo.getGroups:
  console.log("[evo.getGroups] URL:", url, "protocol:", new URL(url).protocol)
```

**Mudanca 3**: Manter o fallback TLS existente no `catch` do `safeFetch` como terceira camada de protecao.

### Resultado esperado

```text
1. resolveProvider converte https://...sslip.io → http://...sslip.io  (camada 1)
2. safeFetch faz request HTTP com redirect: "manual"
3. Se servidor redirecionar para HTTPS, safeFetch intercepta e reescreve para HTTP  (camada 2)
4. Se TLS error ocorrer mesmo assim, catch faz fallback HTTP  (camada 3)
```

### Arquivos modificados
| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/whatsapp-orchestrator/index.ts` | Modificar `safeFetch` para usar `redirect: "manual"` e interceptar redirects HTTPS, adicionar logs de diagnostico em `getGroups` |

