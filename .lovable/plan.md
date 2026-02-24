

## Plano: Compactar Summary Cards na página Anomalias

Aplicar o mesmo estilo compacto do Hub do Colaborador e Painel por Squad nos cards de resumo da página Anomalias.

### Arquivo: `src/pages/Anomalias.tsx`

#### 1. Summary Cards — layout horizontal compacto
- Mudar `SummaryCard` de layout vertical para horizontal (`flex items-center gap-2`)
- Reduzir padding de `p-4` para `px-3 py-2`
- Reduzir valor de `text-2xl` para `text-lg`
- Reduzir label de `text-xs` para `text-[10px]`
- Adicionar icone container `w-7 h-7` com cor de fundo baseada na cor do card (mesmo padrão do Hub)

#### 2. Reduzir gap geral
- Reduzir `space-y-6` do container principal para `space-y-3`
- Reduzir gap do grid de `gap-4` para `gap-3`

#### 3. Header — compactar
- Reduzir titulo de `text-2xl` para `text-lg`
- Reduzir subtitulo de `text-xl` para `text-base`

### Resultado
Mesma compactação do Hub e Squads (~35% menos altura), visual consistente entre todas as páginas.

