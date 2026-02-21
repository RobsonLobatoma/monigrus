

## Correção: "URL de autenticação inválida" no Google OAuth

### Problema

No `handleGoogleLogin` em `Login.tsx`, existe esta validação:

```typescript
if (oauthUrl.hostname !== "accounts.google.com") {
  throw new Error("URL de autenticação inválida");
}
```

O Supabase retorna uma URL no formato `https://nmmbjptgrvsjqeytmxmw.supabase.co/auth/v1/authorize?...` que depois redireciona para o Google. Como o hostname é `nmmbjptgrvsjqeytmxmw.supabase.co` e não `accounts.google.com`, a validação falha e exibe o erro.

### Solução

Alterar a validação para aceitar tanto o hostname do Supabase quanto o do Google:

**Arquivo**: `src/pages/Login.tsx`

Substituir a verificação `oauthUrl.hostname !== "accounts.google.com"` por uma que aceite URLs do Supabase (`nmmbjptgrvsjqeytmxmw.supabase.co`) e do Google (`accounts.google.com`). Qualquer outro hostname será rejeitado.

### Arquivo a modificar

| Arquivo | Acao |
|---|---|
| `src/pages/Login.tsx` | Corrigir validacao de URL no `handleGoogleLogin` |
