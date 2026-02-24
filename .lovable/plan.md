

## Plano: Compactar ainda mais Hero Banner e KPI Cards

### Arquivo: `src/pages/Hub.tsx`

#### 1. Hero Banner — layout horizontal inline (linhas 249-258)
- Mudar de layout vertical (stack) para horizontal: titulo + subtitulo na mesma linha
- Reduzir padding de `px-6 py-4` para `px-5 py-2.5`
- Reduzir rounded de `rounded-2xl` para `rounded-xl`
- Remover a terceira linha ("Seu desempenho impacta...") — mover como tooltip ou remover
- Resultado: banner de ~40px de altura em vez de ~90px

#### 2. KPI Cards — layout horizontal compacto (linhas 321-338)
- Mudar de layout vertical (icone em cima, dados embaixo) para horizontal (icone ao lado do conteudo)
- Reduzir padding de `px-4 py-3` para `px-3 py-2`
- Colocar icone e valor na mesma linha com `flex items-center gap-2`
- Remover subtitulo (`sub`) — manter apenas label e valor
- Reduzir gap do grid de `gap-4` para `gap-3`
- Resultado: cards de ~50px de altura em vez de ~100px

#### 3. Reduzir gap geral
- Reduzir `space-y-4` para `space-y-3`

### Resultado esperado
Aproximadamente 35% menos altura total nas secoes superiores, passando de ~250px para ~160px.

