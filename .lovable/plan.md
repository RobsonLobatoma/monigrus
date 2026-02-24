

## Plano: Mover filtros para o topo da pagina e adicionar filtro de periodo

### Problema
Os filtros de data e gestor estao dentro do card "Grupos do Squad". O usuario quer que eles fiquem no topo da pagina (apos selecionar um squad) para filtrar todos os paineis, e que o filtro de data use opcoes de periodo (7 dias, 14 dias, 30 dias, personalizado) em vez de selecionar um unico dia.

### Arquivo a modificar: `src/pages/Squads.tsx`

### Alteracoes

1. **Substituir estados de filtro** (linhas 71-72):
   - Remover `filterDate: Date | undefined`
   - Adicionar `filterPeriod: string` com valores `"7d"`, `"14d"`, `"30d"`, `"custom"`, `"all"`
   - Adicionar `customDateRange: { from: Date | undefined; to: Date | undefined }`
   - Manter `filterGestor`

2. **Novo memo `dateRange`**: Calcula `startDate` e `endDate` baseado no periodo selecionado:
   - `"7d"` → ultimos 7 dias
   - `"14d"` → ultimos 14 dias
   - `"30d"` → ultimos 30 dias
   - `"custom"` → usa `customDateRange`
   - `"all"` → sem filtro de data

3. **Adicionar barra de filtros no topo** (apos o bloco do "squad header" com capacidade, linha ~236, antes dos KPIs):
   - Um card/barra horizontal com:
     - Botoes de periodo: `7 dias`, `14 dias`, `30 dias`, `Personalizado` (usando ToggleGroup ou botoes com estilo ativo)
     - Quando "Personalizado" selecionado, mostrar Popover com Calendar `mode="range"`
     - Select de gestor de trafego (movido daqui)
     - Campo de busca (movido daqui)
     - Botao "Limpar filtros"

4. **Atualizar `squadGrupos`** (linha ~123): Aplicar filtro de data aqui (comparando `ultima_atividade` com o range calculado) para que os dados filtrados afetem tambem os KPIs e gestores

5. **Atualizar KPIs** (linhas 239-296): Recalcular valores baseados em `filteredGrupos` em vez de `currentSquad` fixo:
   - Score medio = media dos scores dos grupos filtrados
   - Grupos criticos = contagem de status "CRITICO" nos grupos filtrados
   - Alertas ativos = manter do currentSquad (anomalias nao tem filtro de gestor)

6. **Atualizar tabela de Gestores** (linhas 298-336): Filtrar `gestorMetrics` pelo `filterGestor` se nao for "all"

7. **Remover filtros do card "Grupos do Squad"** (linhas 359-404): Remover a secao de filtros do CardHeader, manter apenas o titulo

8. **Atualizar `filteredGrupos`** (linha 148): Adaptar para usar o range de datas em vez de data unica

### Detalhes Tecnicos

- Import `subDays` de `date-fns` para calcular periodos
- O filtro de data compara `new Date(row.dataHora) >= startDate && new Date(row.dataHora) <= endDate`
- O Calendar em modo `"range"` usa `selected={{ from, to }}` e `onSelect` recebe `DateRange`
- Botoes de periodo usam estilo `variant={filterPeriod === "7d" ? "default" : "outline"}` para indicar ativo
- Reset de filtros no `useEffect` do `effectiveTeamId` agora reseta `filterPeriod` para `"all"`
- Layout da barra: `flex items-center flex-wrap gap-2` com fundo `bg-muted/30 rounded-lg p-3 border`

