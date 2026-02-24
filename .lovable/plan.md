

## Plano: Adicionar Tabela de Monitoramento no Detalhe do Squad

### Problema
Quando o usuario seleciona um squad, o painel mostra KPIs e gestores, mas nao exibe a tabela de grupos/clientes com o mesmo formato visual do Painel de Monitoramento (colunas Data/Hora, Grupo, Gestor, Satisfacao, Score, Status, Descricao).

### Solucao
Adicionar uma tabela de monitoramento completa dentro da view de detalhe do squad, filtrando apenas os grupos do squad selecionado. A tabela usara o mesmo estilo visual do `Monitoramento.tsx`.

### Arquivo a modificar: `src/pages/Squads.tsx`

**Alteracoes:**

1. **Novos imports**: Adicionar `useMemo`, `Search`, `Shield`, `useGrupos`, `useMonitoringSettings`

2. **Estilos da tabela**: Copiar os estilos inline (`thStyle`, `tdBase`, `tdColoredOuter`, `cellFill`, `FALLBACK_SAT_STYLE`, `isLightColor`) do `Monitoramento.tsx` para reutilizar o mesmo padrao visual

3. **Dentro do componente** (apos os hooks existentes):
   - Adicionar `const { data: dbGrupos } = useGrupos()`
   - Adicionar hooks de monitoring settings: `useMonitoringSettings("SATISFACAO")`, `useMonitoringSettings("SCORE")`, `useMonitoringSettings("STATUS")`
   - Adicionar estado `const [groupSearch, setGroupSearch] = useState("")`
   - Adicionar memos para `satStyleMap`, `statusStyleMap`, `scoreToSatisfacao` (mesma logica do Monitoramento)
   - Adicionar memo `squadGrupos` que filtra `dbGrupos` por `team_id === effectiveTeamId` e mapeia para o formato da tabela (dataHora, grupo, gestor, satisfacao, score, status, descricao)
   - Adicionar filtro de busca sobre `squadGrupos`

4. **No JSX**, apos o card "Gestores do Squad" (linha ~209), adicionar:
   - Um novo `Card` com titulo "Grupos do Squad" (icone Shield)
   - Campo de busca no header do card
   - Tabela HTML com as colunas: DATA/HORA, GRUPO, GESTOR DE TRAFEGO, SATISFACAO, SCORE, STATUS, DESCRICAO
   - Cada linha usa o mesmo estilo de cores preenchidas para Satisfacao/Score e badges para Status
   - Footer com contagem de registros

### Detalhes Tecnicos

A tabela sera identica visualmente a do `Monitoramento.tsx`:
- Colunas Satisfacao e Score com fundo colorido preenchendo toda a celula (verde/amarelo/vermelho)
- Coluna Status com badge colorido dinamico baseado nas monitoring_settings
- Altura fixa de 56px por linha
- Cores dinamicas vindas do banco (monitoring_settings)
- Busca local por nome do grupo, gestor ou status
- Score calculado a partir de `g.mensagens` (mesmo calculo do Monitoramento)

### Nenhuma funcionalidade existente sera alterada
- A tabela e puramente aditiva
- Os KPIs e a tabela de gestores permanecem intactos
- Compativel com dark mode (usa variaveis CSS)

