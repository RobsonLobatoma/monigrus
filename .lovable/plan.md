

## Plano: Compactar Hero Banner e KPI Cards no Painel por Squad

Aplicar o mesmo estilo compacto do Hub do Colaborador nas seções do Squads.

### Arquivo: `src/pages/Squads.tsx`

#### 1. Squad Header (linhas 303-319)
- Reduzir padding de `p-5` para `px-5 py-2.5`
- Reduzir titulo de `text-xl` para `text-lg`
- Mudar layout para `flex items-center justify-between` inline (sem stack vertical em mobile)
- Reduzir largura do capacity de `w-64` para `w-56`

#### 2. KPI Cards (linhas 408-464)
- Substituir 4 `Card` separados por um grid de divs compactas (mesmo estilo do Hub)
- Layout horizontal: icone ao lado do conteudo com `flex items-center gap-2`
- Reduzir padding de `p-5` para `px-3 py-2`
- Reduzir icone container de `w-10 h-10` para `w-7 h-7`
- Reduzir icone de `size={20}` para `size={14}`
- Reduzir valor de `text-3xl` para `text-lg`
- Remover `mt-1` dos valores
- Remover subtexto "Em breve" do Tempo Resposta

#### 3. Reduzir gap geral
- Reduzir `space-y-6` do container principal para `space-y-3`

### Resultado
Mesma compactacao do Hub (~35% menos altura), visual consistente entre as duas paginas.

