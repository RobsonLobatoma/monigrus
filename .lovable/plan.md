

## Plano: Adicionar barra de filtros global (periodo + gestor) no Hub do Colaborador e Monitoramento

### Problema
As paginas "Hub do Colaborador" e "Monitoramento" so possuem um campo de busca textual. O usuario quer a mesma barra de filtros globais que foi implementada no Squads: botoes de periodo (7 dias, 14 dias, 30 dias, Personalizado) + select de gestor de trafego + busca + botao limpar. Os filtros devem afetar KPIs (no Hub) e a tabela.

### Arquivos a modificar

---

### 1. `src/pages/Hub.tsx`

**Novos imports**: `format`, `subDays` de `date-fns`; `DateRange` de `react-day-picker`; `CalendarIcon`, `X`, `Filter` de `lucide-react`; `Button`; `Calendar`; `Popover/PopoverContent/PopoverTrigger`; `Select/SelectContent/SelectItem/SelectTrigger/SelectValue`; `cn`

**Novos estados** (apos `search`):
- `filterPeriod: "all" | "7d" | "14d" | "30d" | "custom"` (default `"all"`)
- `customDateRange: DateRange | undefined`
- `filterGestor: string` (default `"all"`)

**Novos memos**:
- `dateRange`: calcula `from/to` baseado em `filterPeriod` (mesma logica do Squads)
- `gestoresList`: lista unica de gestores extraida de `GRUPOS`
- `hasActiveFilters` e funcao `clearAllFilters`

**Atualizar `filtered`** (linha 119): adicionar filtro de data (comparar `dataHora` com range) e filtro de gestor

**Atualizar KPIs** (linhas 114-117): recalcular `totalGrupos`, `criticos`, `scoreMedia`, `resolvidos` a partir de `filtered` em vez de `GRUPOS`

**No JSX**: Inserir a barra de filtros entre o Hero Banner e os Metric Cards (apos linha 137, antes da linha 139). Layout identico ao Squads:
- `<div className="flex items-center flex-wrap gap-2 bg-muted/30 rounded-lg p-3 border">`
- Botoes 7d/14d/30d, Popover com Calendar mode="range", Select de gestor, campo de busca, botao Limpar

**Remover** o campo de busca antigo do header do "Painel de Monitoramento" (linhas 165-174)

---

### 2. `src/pages/Monitoramento.tsx`

**Novos imports**: `format`, `subDays` de `date-fns`; `DateRange` de `react-day-picker`; `CalendarIcon`, `X`, `Filter` de `lucide-react`; `Button`; `Calendar`; `Popover/PopoverContent/PopoverTrigger`; `Select/SelectContent/SelectItem/SelectTrigger/SelectValue`; `cn`

**Novos estados** (apos `search`):
- `filterPeriod`, `customDateRange`, `filterGestor` (mesmos tipos)

**Novos memos**:
- `dateRange`: mesma logica
- `gestoresList`: lista unica de `gestorTrafego` extraida de `data`
- `hasActiveFilters` e `clearAllFilters`

**Atualizar `filtered`** (linha 162): adicionar filtro de data e gestor alem da busca textual existente

**No JSX**: Inserir barra de filtros entre o Header e o Table card (apos linha 212, antes da linha 214). Mesmo layout:
- Botoes de periodo + Popover Calendar range + Select gestor + busca + Limpar

**Remover** o campo de busca antigo do header (linhas 202-211)

---

### Detalhes Tecnicos

- A barra de filtros usa o mesmo JSX/estilos do Squads: `bg-muted/30 rounded-lg p-3 border`, botoes `h-8 text-xs`, Calendar com `pointer-events-auto`, separador `w-px h-6 bg-border`
- No Hub, os KPIs passam a derivar de `filtered` para refletir os filtros ativos
- No Monitoramento, o counter do footer (`filtered.length de data.length`) ja funciona corretamente
- O filtro de data compara `new Date(row.dataHora)` com o range calculado; linhas com `dataHora === "—"` sao excluidas quando ha filtro de data ativo

