

## Plano: Compactar Hero Banner e KPI Cards no Hub do Colaborador

### Objetivo
Reduzir a altura das secoes superiores (hero banner + KPI cards) para diminuir a rolagem e dar mais visibilidade a tabela de monitoramento.

### Arquivo: `src/pages/Hub.tsx`

#### 1. Compactar o Hero Banner (linhas 249-258)
- Reduzir padding de `px-8 py-7` para `px-6 py-4`
- Reduzir titulo de `text-3xl` para `text-xl`
- Reduzir subtitulo de `text-base mb-3` para `text-sm mb-1`
- Reduzir nota inferior de `text-[11px]` para `text-[10px]`
- Manter o gradiente e a identidade visual

#### 2. Compactar os KPI Cards (linhas 322-337)
- Reduzir padding de `px-5 py-4` para `px-4 py-3`
- Reduzir espaco interno de `space-y-3` para `space-y-1`
- Reduzir icone container de `w-9 h-9` para `w-7 h-7`
- Reduzir icone de `size={18}` para `size={14}`
- Reduzir valor de `text-2xl` para `text-xl`
- Manter labels e subtitulos nos mesmos tamanhos

#### 3. Reduzir gap geral
- Reduzir `space-y-6` do container principal para `space-y-4`

### Resultado
Aproximadamente 30-40% menos altura nas secoes superiores, mantendo todas as informacoes visiveis e a identidade visual intacta.

