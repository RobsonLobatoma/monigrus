

## Correção do erro `redirect_uri_mismatch` no Google OAuth

### Diagnóstico

O erro **400: redirect_uri_mismatch** significa que a URL de callback usada pelo Supabase para o Google OAuth nao esta cadastrada no Google Cloud Console. Isso e puramente um problema de configuracao nos paineis do Google e do Supabase -- nao e um bug no codigo.

### O que precisa ser feito

Este problema exige **3 acoes**, sendo 2 manuais (nos paineis) e 1 no codigo:

---

### Acao 1 — Configurar o Google Cloud Console (manual)

Acesse: [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)

1. Selecione o projeto correto
2. Clique no **OAuth Client ID** que voce criou
3. Em **"Authorized redirect URIs"** (URIs de redirecionamento autorizados), adicione:
   - `https://nmmbjptgrvsjqeytmxmw.supabase.co/auth/v1/callback`
4. Em **"Authorized JavaScript origins"** (Origens JavaScript autorizadas), adicione:
   - `https://id-preview--ac65ab5f-71c9-463c-8db1-4dfc99f55ca1.lovable.app`
   - (e qualquer dominio customizado que voce use)
5. Salve as alteracoes

A URL de callback do Supabase segue sempre o formato:
`https://<PROJECT_ID>.supabase.co/auth/v1/callback`

---

### Acao 2 — Configurar o Supabase Dashboard (manual)

Acesse: [Supabase Auth - URL Configuration](https://supabase.com/dashboard/project/nmmbjptgrvsjqeytmxmw/auth/url-configuration)

1. **Site URL**: defina como a URL principal do seu app (ex: `https://id-preview--ac65ab5f-71c9-463c-8db1-4dfc99f55ca1.lovable.app`)
2. **Redirect URLs**: adicione:
   - `https://id-preview--ac65ab5f-71c9-463c-8db1-4dfc99f55ca1.lovable.app`
   - `https://id-preview--ac65ab5f-71c9-463c-8db1-4dfc99f55ca1.lovable.app/**`

Tambem confirme que o provedor Google esta ativo em:
[Supabase Auth - Providers](https://supabase.com/dashboard/project/nmmbjptgrvsjqeytmxmw/auth/providers)

Com o **Client ID** e **Client Secret** do Google preenchidos.

---

### Acao 3 — Melhoria no codigo (Login.tsx)

Pequena melhoria no `handleGoogleLogin` para lidar com ambientes de preview do Lovable (que usam iframes e podem bloquear cookies de terceiros):

**Arquivo**: `src/pages/Login.tsx`

- Usar `skipBrowserRedirect: true` quando em dominio customizado ou preview
- Validar a URL do OAuth antes de redirecionar
- Manter o fluxo padrao para dominios Lovable

---

### Resumo

| Acao | Onde | O que fazer |
|---|---|---|
| 1 | Google Cloud Console | Adicionar `https://nmmbjptgrvsjqeytmxmw.supabase.co/auth/v1/callback` como Redirect URI |
| 2 | Supabase Dashboard | Configurar Site URL e Redirect URLs com o dominio do app |
| 3 | Codigo (`Login.tsx`) | Melhorar `handleGoogleLogin` para ambientes de preview |

Apos as configuracoes manuais estarem corretas, o login com Google funcionara normalmente.

