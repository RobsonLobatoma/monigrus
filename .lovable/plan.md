
## Plano: Padronizacao do Dark Mode em Toda a Aplicacao

### Problema Identificado

A aplicacao possui suporte a dark mode via classe `.dark` no CSS, porem diversas paginas usam **cores hardcoded** que ficam incorretas no modo escuro. Foram identificados problemas em 4 arquivos principais.

---

### Problemas por Arquivo

#### 1. Hub.tsx (linha 248)
- **Status column**: `color: "#111827"` (preto fixo) -- invisivel no dark mode
- Correcao: trocar para `color: "hsl(var(--foreground))"`

#### 2. Monitoramento.tsx (linha 310)
- **Status column fallback**: `color: "#111827"` (preto fixo) -- invisivel no dark mode
- Correcao: trocar para `color: "hsl(var(--foreground))"`

#### 3. Anomalias.tsx (linhas 20-31)
- **SEVERITY_STYLES e STATUS_STYLES**: usam cores fixas como `text: "#000"` e `text: "#fff"` -- esses sao badges coloridos com fundo proprio, entao o contraste e controlado internamente. **Sem problema real** aqui pois os badges tem fundo solido.
- **Sem alteracao necessaria** neste arquivo.

#### 4. Configuracoes.tsx
- **Modais com `bg-muted/40`**: Os inputs em modais de criacao (Novo Usuario, Novo Squad, Vincular Grupo) usam `bg-muted/40` que funciona em ambos os temas. **OK, sem problema.**
- **`text-slate-300`** (linhas 594, 606): Usado dentro do bloco "Simulador de Cargo" que tem fundo escuro proprio (`#0f172a`). Funciona em ambos os temas pois o fundo e fixo escuro. **OK.**
- **`text-white`** em banners com gradiente/fundo fixo escuro: Funciona corretamente pois tem contexto de fundo proprio. **OK.**

#### 5. Conexoes.tsx (linha 96)
- **Titulo `h1`**: usa `text-3xl font-bold tracking-tight` sem classe de cor explicita -- herda `text-foreground` do body. **OK.**

#### 6. index.css / App.css
- **App.css**: Contem estilos do template Vite (`.logo`, `.card`, `.read-the-docs`) que nao sao usados na app mas poluem. O `#root` tem `max-width: 1280px` e `padding: 2rem` que podem conflitar com o layout.
- Correcao: Limpar App.css (remover estilos nao utilizados do template Vite).

#### 7. select/option em dark mode
- Os elementos `<select>` nativos com `<option>` nao respeitam dark mode em todos os browsers. As opcoes de dropdown podem aparecer com fundo branco e texto escuro mesmo no dark mode.
- Correcao: Adicionar regra CSS global para `option` no dark mode.

---

### Alteracoes Planejadas

| Arquivo | Alteracao | Impacto |
|---|---|---|
| `src/pages/Hub.tsx` | Trocar `color: "#111827"` por `color: "hsl(var(--foreground))"` na coluna Status (linha 248) | Texto visivel no dark mode |
| `src/pages/Monitoramento.tsx` | Trocar `color: "#111827"` por `color: "hsl(var(--foreground))"` no fallback de Status (linha 310) | Texto visivel no dark mode |
| `src/index.css` | Adicionar regra para `select option` no dark mode | Dropdowns nativos respondem ao tema |
| `src/App.css` | Remover estilos Vite nao utilizados (`#root` constraints, `.logo`, `.card`, `.read-the-docs`) | Elimina conflitos de layout |

### Garantias
- Zero remocao de funcionalidades existentes
- Zero alteracao de layout
- Apenas correcoes de cor pontuais e limpeza de CSS morto
- Todos os elementos que ja usam variaveis CSS (bg-card, text-foreground, border-border) permanecem inalterados
