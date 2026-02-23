
## Plano: Governanca Operacional e Inteligencia de Performance

### Visao Geral

Evoluir o sistema existente para uma plataforma completa de governanca operacional, adicionando: Dashboard Executivo na pagina inicial, Painel por Squad para Supervisores, controle de capacidade, ranking de performance, e sistema de atribuicao inteligente de grupos. Toda implementacao e aditiva -- zero alteracoes destrutivas.

### Mapeamento do Sistema Atual

O sistema ja possui:
- **RBAC com 4 niveis**: DIRETOR (1), GERENTE (2), SUPERVISOR (3), OPERACIONAL (4) -- ja implementado
- **Tabelas existentes**: `teams` (squads), `grupos`, `user_profiles`, `user_roles`, `anomalias`, `sla`, `churn`
- **Paginas existentes**: Dashboard (Index), Hub do Colaborador, Monitoramento (global), Anomalias, Conexoes, Configuracoes
- **Controle de permissoes**: via `permissions` e `role_permissions` com codigos como VIEW_HUB, VIEW_MONITORAMENTO, etc.

### O Que Sera Implementado

```text
Fase 1: Dashboard Executivo (pagina /)
Fase 2: Painel por Squad (nova pagina /squads)
Fase 3: Controle de capacidade e atribuicao
Fase 4: Rankings e alertas inteligentes
```

---

### Fase 1 -- Dashboard Executivo (Evolucao da pagina Index)

**Arquivo**: `src/pages/Index.tsx` (reescrever conteudo, manter rota)

A pagina inicial atualmente e apenas um placeholder com link para Monitoramento. Sera transformada em um Dashboard Executivo completo.

**Acesso**: DIRETOR e GERENTE (visao global); SUPERVISOR (visao filtrada por squad)

**Componentes do Dashboard**:

1. **Banner de boas-vindas** com nome do usuario e cargo
2. **KPIs Globais** (4 cards):
   - Score Medio Global (media dos scores de todos os grupos)
   - Total de Grupos Ativos
   - Alertas Criticos (contagem de anomalias criticas abertas)
   - Taxa de Resolucao (% de grupos RESOLVIDO)
3. **Grafico de Score Historico** (Recharts AreaChart) -- usando dados dos grupos por data
4. **Ranking de Squads** (tabela com score medio, grupos, capacidade %)
5. **Ranking de Gestores** (top 10 por score medio dos seus grupos)
6. **Tendencia de Risco** (Recharts BarChart mostrando distribuicao de satisfacao)
7. **Ultimas Anomalias** (5 mais recentes com severidade e grupo)

**Dados**: Calculados no frontend a partir das tabelas existentes (`grupos`, `teams`, `anomalias`, `user_profiles`). Sem necessidade de novas tabelas para esta fase.

---

### Fase 2 -- Painel por Squad (Nova Pagina)

**Arquivo novo**: `src/pages/Squads.tsx`

**Acesso**: SUPERVISOR (ve apenas seu squad), GERENTE e DIRETOR (veem todos, com seletor)

**Conteudo por Squad**:

1. **Header com nome do Squad e Supervisor**
2. **Indicador de Capacidade** (Progress bar: X/110 grupos)
3. **KPIs do Squad** (4 cards):
   - Score Medio do Squad
   - Grupos Criticos
   - Tempo Medio de Resposta (placeholder, futuramente via WhatsApp)
   - Alertas Ativos
4. **Lista de Gestores do Squad** com:
   - Nome, grupos atribuidos, capacidade (X/35), score medio
   - Badge de alerta quando >= 90% capacidade
5. **Tabela de Grupos do Squad** (mesma estrutura do Monitoramento, filtrada)
6. **Ranking Interno de Gestores** (ordenado por score medio)

**Rotas**: Adicionar `/squads` no `App.tsx` e item no sidebar

---

### Fase 3 -- Controle de Capacidade e Atribuicao

**Migracoes SQL necessarias**:

A tabela `grupos` ja existe com `team_id` (squad) e `gestor` (texto). Para suportar atribuicao inteligente, precisamos:

1. **Adicionar coluna `gestor_id`** (uuid, FK opcional) na tabela `grupos` -- para vincular gestor via user_id ao inves de texto livre
2. **Adicionar coluna `capacidade_maxima`** na tabela `teams` (integer, default 110)
3. **Adicionar coluna `capacidade_maxima_gestor`** na tabela `user_profiles` (integer, default 35)

**Logica de capacidade** (calculada no frontend):
- Contar grupos por team_id para capacidade do squad
- Contar grupos por gestor_id para capacidade do gestor
- Alertar quando >= 90% (visual: badge amarelo/vermelho)

**Sistema de Atribuicao** (na pagina Configuracoes, aba Gestao de Grupos):
- Ao vincular grupo a um gestor, validar capacidade (< 35)
- Ao vincular grupo a um squad, validar capacidade (< 110)
- Mostrar sugestao do "melhor gestor disponivel" (aquele com menor numero de grupos no squad)
- Bloquear atribuicao quando capacidade maxima atingida

---

### Fase 4 -- Rankings e Alertas Inteligentes

**Componente novo**: `src/components/CapacityAlert.tsx`
- Componente reutilizavel que mostra alertas de capacidade
- Usado no Dashboard, Painel por Squad e Configuracoes

**Hook novo**: `src/hooks/useOperationalMetrics.ts`
- Calcula metricas agregadas: score medio por squad, por gestor, ranking, capacidade
- Reutilizado em Dashboard, Squads e Configuracoes

**Logica de ranking**:
- Score medio do gestor = media dos scores dos grupos atribuidos
- Score medio do squad = media dos scores de todos os grupos do squad
- Ranking global = squads ordenados por score medio desc

**Alertas preditivos**:
- Gestor com >= 90% capacidade (>= 32 grupos) -- badge amarelo
- Squad com >= 90% capacidade (>= 99 grupos) -- badge amarelo
- Gestor ou Squad com 100% capacidade -- badge vermelho + bloqueio

---

### Detalhes Tecnicos

**Arquivos a criar**:

| Arquivo | Descricao |
|---|---|
| `src/pages/Squads.tsx` | Painel por Squad |
| `src/hooks/useOperationalMetrics.ts` | Hook de metricas agregadas e rankings |
| `src/components/CapacityAlert.tsx` | Componente de alerta de capacidade |

**Arquivos a modificar**:

| Arquivo | Alteracao |
|---|---|
| `src/pages/Index.tsx` | Substituir placeholder por Dashboard Executivo completo |
| `src/App.tsx` | Adicionar rota /squads |
| `src/components/AppSidebar.tsx` | Adicionar item "Squads" no menu (com icone LayoutGrid e permissao VIEW_SQUADS) |

**Migracao SQL**:

```sql
-- Adicionar capacidade maxima aos squads
ALTER TABLE public.teams 
  ADD COLUMN IF NOT EXISTS capacidade_maxima integer NOT NULL DEFAULT 110;

-- Adicionar capacidade maxima por gestor
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS capacidade_maxima_gestor integer NOT NULL DEFAULT 35;

-- Adicionar gestor_id como FK para vincular gestor por user_id
ALTER TABLE public.grupos 
  ADD COLUMN IF NOT EXISTS gestor_id uuid REFERENCES auth.users(id);

-- Inserir permissao VIEW_SQUADS
INSERT INTO public.permissions (code, description, module) 
  VALUES ('VIEW_SQUADS', 'Visualizar painel de squads', 'SQUADS')
  ON CONFLICT (code) DO NOTHING;

-- Conceder permissao a DIRETOR, GERENTE e SUPERVISOR
INSERT INTO public.role_permissions (role, permission_id)
  SELECT r.role, p.id 
  FROM (VALUES ('DIRETOR'::app_role), ('GERENTE'::app_role), ('SUPERVISOR'::app_role)) AS r(role)
  CROSS JOIN public.permissions p 
  WHERE p.code = 'VIEW_SQUADS'
  ON CONFLICT DO NOTHING;
```

**Nota sobre `gestor_id`**: A FK para `auth.users` nao e recomendada pelo Supabase. Em vez disso, armazenaremos como `uuid` simples sem FK, e a validacao sera feita no nivel de aplicacao (verificando se existe em `user_profiles`).

**Graficos**: Usar `recharts` (ja instalado) -- AreaChart para score historico, BarChart para distribuicao de risco, PieChart opcional para status.

**Responsividade**: Todos os novos paineis usarao grid responsivo (`grid-cols-1 md:grid-cols-2 lg:grid-cols-4`).

**Dark mode**: Todos os novos componentes usarao exclusivamente variaveis CSS do tema (`text-foreground`, `bg-card`, `border-border`, etc.).

---

### Garantias

- Zero remocao de funcionalidades existentes
- Zero quebra de fluxos atuais
- Zero alteracao de tabelas existentes (apenas adicao de colunas)
- Toda implementacao e aditiva e modular
- RBAC existente e respeitado integralmente
- Compativel com dark mode
