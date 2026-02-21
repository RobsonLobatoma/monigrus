

## Tela de Login, Registro, Google Auth e Recuperacao de Senha

### Resumo

Criar o sistema completo de autenticacao integrado ao Supabase Auth, com login por email/senha, registro, login com Google, e recuperacao de senha. Novos usuarios cadastrados serao automaticamente vistos nas secoes de Configuracoes gracas ao trigger `handle_new_user` ja existente no banco (que cria `user_profiles` e `user_roles` automaticamente).

Nenhum layout, menu ou funcionalidade existente sera removido ou alterado.

---

### Arquivos a criar

| Arquivo | Descricao |
|---|---|
| `src/contexts/AuthContext.tsx` | Contexto global de autenticacao com sessao Supabase, login, registro, logout, reset password |
| `src/components/ProtectedRoute.tsx` | Wrapper que redireciona para /login se nao autenticado |
| `src/pages/Login.tsx` | Tela de login com email/senha + botao Google + link para registro e recuperacao |
| `src/pages/Register.tsx` | Tela de registro com nome, email e senha |
| `src/pages/ForgotPassword.tsx` | Tela para solicitar reset de senha por email |
| `src/pages/ResetPassword.tsx` | Tela para definir nova senha (acessada via link do email) |

### Arquivos a modificar

| Arquivo | O que muda |
|---|---|
| `src/App.tsx` | Envolver com `AuthProvider`; adicionar rotas publicas `/login`, `/register`, `/forgot-password`, `/reset-password`; envolver rotas existentes com `ProtectedRoute` |
| `src/components/AppLayout.tsx` | Exibir nome do usuario logado no header (via `useAuth`); botao "Sair" funcional |
| `src/components/AppSidebar.tsx` | Botao "Sair" chama `signOut` do contexto |

---

### Detalhes tecnicos

#### 1. AuthContext

- Usa `supabase.auth.onAuthStateChange` (configurado ANTES de `getSession`)
- Expoe: `user`, `session`, `loading`, `signIn`, `signUp`, `signOut`, `resetPassword`
- `signUp` recebe `full_name` nos metadados para o trigger `handle_new_user` usar
- Google OAuth usa `skipBrowserRedirect: true` conforme configuracao existente no projeto

#### 2. ProtectedRoute

- Se `loading`, exibe spinner
- Se nao ha `session`, redireciona para `/login`
- Caso contrario, renderiza `children`

#### 3. Pagina de Login

- Campos: email, senha
- Botao "Entrar"
- Botao "Entrar com Google" (chama `supabase.auth.signInWithOAuth({ provider: 'google' })`)
- Links: "Esqueci minha senha" -> `/forgot-password`, "Criar conta" -> `/register`
- Visual: card centralizado com logo MONIGRU, cores do sistema (primary blue/purple gradient)

#### 4. Pagina de Registro

- Campos: nome completo, email, senha, confirmar senha
- Botao "Criar conta"
- Ao registrar, `signUp` passa `full_name` nos `options.data` -> trigger cria `user_profiles` e `user_roles` automaticamente
- Link: "Ja tenho conta" -> `/login`

#### 5. Pagina Forgot Password

- Campo: email
- Botao "Enviar link"
- Chama `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`
- Exibe mensagem de confirmacao

#### 6. Pagina Reset Password

- Detecta `type=recovery` na URL hash
- Campos: nova senha, confirmar senha
- Chama `supabase.auth.updateUser({ password })`
- Redireciona para `/login` apos sucesso

#### 7. App.tsx — rotas

```text
/login              -> Login (publica)
/register           -> Register (publica)
/forgot-password    -> ForgotPassword (publica)
/reset-password     -> ResetPassword (publica)
/                   -> ProtectedRoute > AppLayout > Index
/hub                -> ProtectedRoute > AppLayout > Hub
/monitoramento      -> ProtectedRoute > AppLayout > Monitoramento
/configuracoes      -> ProtectedRoute > AppLayout > Configuracoes
... demais rotas protegidas
```

#### 8. AppSidebar e AppLayout

- O botao "Sair" na sidebar chama `signOut()` do AuthContext
- O header exibe `user.user_metadata.full_name` ou o email do usuario logado
- Nenhuma outra alteracao visual

#### 9. Integracao com Configuracoes

Nenhuma alteracao necessaria em Configuracoes.tsx neste momento. O trigger `handle_new_user` ja existente no banco garante que cada novo cadastro cria automaticamente:
- Um registro em `user_profiles` (com `full_name` e `email`)
- Um registro em `user_roles` (com cargo `OPERACIONAL`)

Quando as secoes de Configuracoes forem conectadas ao Supabase (hooks `useUserProfiles`, `useTeams`, `useGrupos` — etapa futura), os novos usuarios apareccerao automaticamente nas listagens.

---

### Pre-requisito: Google OAuth

Para o login com Google funcionar, o usuario precisa configurar no Google Cloud Console e no painel do Supabase:
1. Criar credenciais OAuth no Google Cloud Console
2. Adicionar as redirect URLs do Supabase
3. Habilitar o provider Google no Supabase Dashboard > Authentication > Providers

Sera adicionado um comentario no codigo e uma orientacao no chat apos a implementacao.

---

### Nenhuma migracao de banco necessaria

O trigger `handle_new_user` e as tabelas `user_profiles` e `user_roles` ja existem e estao configurados corretamente.

