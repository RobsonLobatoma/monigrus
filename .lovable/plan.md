

## Plano: Adicionar filtros de Data e Gestor de Trafego na tabela "Grupos do Squad"

### Problema
Apos selecionar um squad, a tabela "Grupos do Squad" so tem um campo de busca textual. O usuario precisa de filtros dedicados por data e por gestor de trafego.

### Arquivo a modificar: `src/pages/Squads.tsx`

### Alteracoes

1. **Novos imports**: Adicionar `CalendarIcon`, `Filter` do lucide-react; `Popover`, `PopoverContent`, `PopoverTrigger` de `@/components/ui/popover`; `Calendar` de `@/components/ui/calendar`; `Button` de `@/components/ui/button`; `format` de `date-fns`

2. **Novos estados** (junto aos existentes, linha ~63):
   - `const [filterDate, setFilterDate] = useState<Date | undefined>(undefined)`
   - `const [filterGestor, setFilterGestor] = useState<string>("all")`

3. **Lista unica de gestores** (memo):
   - Extrair todos os valores distintos de `gestorTrafego` do `squadGrupos` para popular o Select de gestores

4. **Atualizar `filteredGrupos`** (linha ~126): Adicionar condicoes ao filtro existente:
   - Se `filterDate` estiver definido, comparar a data de `row.dataHora` com a data selecionada
   - Se `filterGestor` nao for `"all"`, filtrar por `row.gestorTrafego === filterGestor`

5. **No JSX do CardHeader da tabela** (linhas ~313-329): Adicionar uma barra de filtros ao lado do campo de busca contendo:
   - Um `Popover` com `Calendar` (mode="single") para selecionar data, com botao mostrando a data selecionada ou "Filtrar por data"
   - Um `Select` para gestor de trafego com opcao "Todos os gestores" + lista dinamica
   - Manter o campo de busca existente

### Detalhes Tecnicos

- O filtro de data compara apenas a parte de data (YYYY-MM-DD) do campo `ultima_atividade` com a data selecionada via `format(filterDate, "yyyy-MM-dd")`
- O Calendar usa `className="p-3 pointer-events-auto"` para funcionar dentro do Popover
- Os filtros sao resetados quando o usuario troca de squad (via efeito no `effectiveTeamId`)
- Layout responsivo: filtros empilham em telas menores usando `flex-wrap`

