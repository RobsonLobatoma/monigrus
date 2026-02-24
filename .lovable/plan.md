

## Plano: Remover filtro de gestor do Hub do Colaborador

### Problema
O "Hub do Colaborador" e o "Painel de Monitoramento (PESSOAL)" devem exibir apenas os dados pessoais do colaborador logado. O filtro "Todos os gestores" nao faz sentido neste contexto pessoal.

### Arquivo a modificar: `src/pages/Hub.tsx`

### Alteracoes

1. **Remover estado `filterGestor`** (linha 112) e o memo `gestoresList` (linhas 144-147)

2. **Remover imports nao mais necessarios**: `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` (linha 11)

3. **Atualizar `hasActiveFilters`** (linha 149): remover condicao `filterGestor !== "all"`

4. **Atualizar `clearAllFilters`** (linhas 150-155): remover `setFilterGestor("all")`

5. **Atualizar `filtered`** (linha 162): remover condicao `matchGestor`

6. **No JSX da barra de filtros** (linhas 237-249): remover o separador vertical e o bloco `<Select>` do gestor de trafego. Manter apenas os botoes de periodo, calendario personalizado, busca e botao limpar

