
## Sistema de Login MONIGRU — Integrado ao Supabase Auth + RBAC

### Visão geral

O sistema de login será integrado ao Supabase Auth existente, respeitando as políticas RLS e a hierarquia de cargos já configuradas (`DIRETOR`, `GERENTE`, `SUPERVISOR`, `OPERACIONAL`). A tela seguirá o design da imagem de referência: logo, card centralizado, campos email/senha, link de recuperação de senha e link para criar conta.

---

### Como o fluxo vai funcionar

```text
Usuário acessa qualquer rota
         ↓
  AuthContext verifica sessão Supabase
         ↓
  Não autenticado → redireciona para /login
  Autenticado     → carrega app normalmente
         ↓
  Após login: busca user_profiles + user_roles
  do usuário logado (nome, cargo, equipe)
         ↓
  Topbar exibe nome real e cargo real do BD
  Sidebar "Sair" chama supabase.auth.signOut()
```

---

### Arquivos a criar

**1. `src/contexts/AuthContext.tsx`** — Contexto global de autenticação
- Escuta `onAuthStateChange` do Supabase
- Expõe `session`, `user`, `profile` (do `user_profiles`), `role` (do `user_roles`), e `signOut()`
- Busca automaticamente o perfil e cargo após login

**2. `src/pages/Login.tsx`** — Tela de login (design baseado na imagem)
- Logo MONIGRU com inicial "M" em fundo azul (cor `primary` do projeto)
- Título "MONIGRU" + subtítulo "Sistema de Monitoramento de Grupos"
- Card centralizado com:
  - Campo Email com label
  - Campo Senha com toggle de visibilidade (olho)
  - Link "Esqueceu sua senha?" → vai para `/recuperar-senha`
  - Botão "Entrar" (full width, cor primária)
  - Divisor "OU CONTINUE COM" + botão Google (opcional, configurável)
  - Link "Não tem uma conta? Criar conta" → vai para `/cadastro`
- Fundo com cor `muted` suave (cinza claro, ou `bg-muted`)

**3. `src/pages/Cadastro.tsx`** — Tela de criação de conta
- Formulário: nome completo, email, senha, confirmação de senha
- Cria conta via `supabase.auth.signUp()`
- Após cadastro, redireciona para `/login` com mensagem de confirmação

**4. `src/pages/RecuperarSenha.tsx`** — Recuperação de senha
- Campo email
- Chama `supabase.auth.resetPasswordForEmail()`
- Mostra confirmação de envio

**5. `src/pages/RedefinirSenha.tsx`** — Redefinição de senha (rota `/redefinir-senha`)
- Detecta `type=recovery` na URL
- Formulário nova senha + confirmação
- Chama `supabase.auth.updateUser({ password })`

**6. `src/components/ProtectedRoute.tsx`** — Guarda de rota
- Redireciona para `/login` se não autenticado
- Mostra spinner enquanto verifica sessão

---

### Arquivos a modificar

**7. `src/App.tsx`**
- Envolve tudo no `AuthProvider`
- Rotas públicas: `/login`, `/cadastro`, `/recuperar-senha`, `/redefinir-senha`
- Rotas protegidas: todas as outras, envolvidas por `<ProtectedRoute>`
- Layout `AppLayout` apenas nas rotas protegidas

**8. `src/components/AppLayout.tsx`**
- Topbar: substituir "Dr. Ricardo / Diretor" hardcoded pelo nome e cargo real do `AuthContext`
- Inicial do avatar gerada a partir do nome real

**9. `src/components/AppSidebar.tsx`**
- Botão "Sair" chama `signOut()` do `AuthContext`
- Filtra itens de navegação conforme o cargo do usuário logado (baseado em `ACCESS_MATRIX` já existente em Configurações)

---

### Segurança e integração com RLS

- As RLS policies já existentes (`user_profiles_read_self`, `user_roles_read_self`, `grupos_select_role_scoped`, etc.) passarão a funcionar assim que o usuário estiver autenticado
- O token JWT do Supabase é enviado automaticamente em todas as queries pelo cliente existente
- `can_manage_users()` no banco retorna `true` para DIRETOR e GERENTE → eles podem editar em Configurações
- Não há dados sensíveis armazenados no `localStorage` além da sessão gerenciada pelo Supabase

---

### Tabela de arquivos

| Arquivo | Ação |
|---|---|
| `src/contexts/AuthContext.tsx` | Criar — contexto global de auth |
| `src/pages/Login.tsx` | Criar — tela de login |
| `src/pages/Cadastro.tsx` | Criar — tela de cadastro |
| `src/pages/RecuperarSenha.tsx` | Criar — recuperar senha |
| `src/pages/RedefinirSenha.tsx` | Criar — redefinir senha |
| `src/components/ProtectedRoute.tsx` | Criar — guarda de rotas |
| `src/App.tsx` | Modificar — rotas públicas/protegidas + AuthProvider |
| `src/components/AppLayout.tsx` | Modificar — topbar com dados reais do usuário |
| `src/components/AppSidebar.tsx` | Modificar — signOut funcional + filtro de menu por cargo |

---

### Nota sobre Google OAuth

O botão "Continuar com Google" será incluído na tela de login, mas exigirá configuração manual no painel do Supabase (Authentication → Providers → Google). Será exibida uma instrução clara na interface caso o provedor não esteja ativo.
