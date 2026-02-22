

## Plano: Sessoes de Configuracao para Monitoramento

### Objetivo

Adicionar 4 novas sub-secoes dentro da aba "Gestao de Hierarquia e Acessos" (pagina Configuracoes) para gerenciar manualmente os valores utilizados nas colunas do Monitoramento:

1. **Palavras Chave** - palavras para monitorar na coluna "Descricao"
2. **Satisfacao** - opcoes de satisfacao (ex: Otimo, Regular, Ruim)
3. **Score** - faixas/regras de score
4. **Status** - opcoes de status (ex: RESOLVIDO, PENDENTE, CRITICO)

Cada secao tera funcionalidade completa de criar, editar, remover e salvar.

### Etapa 1 -- Nova tabela no banco de dados

Criar uma unica tabela `monitoring_settings` para armazenar todas as configuracoes:

```text
monitoring_settings:
  id (uuid PK, default gen_random_uuid())
  category (text NOT NULL) -- 'PALAVRA_CHAVE' | 'SATISFACAO' | 'SCORE' | 'STATUS'
  label (text NOT NULL) -- o valor exibido (ex: "Otimo", "PENDENTE", "reclamacao")
  color (text DEFAULT '') -- cor opcional para badges (hex)
  min_value (integer NULL) -- para Score: valor minimo da faixa
  max_value (integer NULL) -- para Score: valor maximo da faixa
  is_active (boolean DEFAULT true)
  sort_order (integer DEFAULT 0)
  created_at (timestamptz DEFAULT now())
  updated_at (timestamptz DEFAULT now())
```

RLS: leitura para autenticados, escrita para `can_manage_users()`.

Seed inicial com os valores atualmente hardcoded no sistema:
- Satisfacao: Otimo, Regular, Ruim
- Status: RESOLVIDO, PENDENTE, CRITICO
- Score: 0-40 (Ruim), 41-70 (Regular), 71-100 (Otimo)
- Palavras Chave: "reclamou", "sem retorno", "confirmou" (exemplos)

### Etapa 2 -- Hook useMonitoringSettings

Criar `src/hooks/useMonitoringSettings.ts`:
- `useMonitoringSettings(category?)` - busca settings filtrados por categoria
- `useCreateMonitoringSetting()` - mutation para criar
- `useUpdateMonitoringSetting()` - mutation para editar
- `useDeleteMonitoringSetting()` - mutation para remover
- React Query com invalidacao automatica

### Etapa 3 -- Nova aba em Configuracoes.tsx

Adicionar uma nova aba **"Monitoramento"** ao TabsList existente (apos "Hierarquia & Permissoes"), com icone `Monitor`.

Dentro da aba, 4 secoes em cards:

**Card 1 - Palavras Chave:**
- Tabela com colunas: PALAVRA, STATUS (ativo/inativo), ACOES
- Botao "Nova Palavra Chave" que abre input inline ou modal simples
- Botoes editar/remover por linha

**Card 2 - Satisfacao:**
- Tabela com colunas: LABEL, COR, ACOES
- Preview visual do badge com a cor selecionada
- Botao "Nova Opcao"

**Card 3 - Score:**
- Tabela com colunas: FAIXA (min-max), LABEL, COR, ACOES
- Permite definir faixas de score com limites numericos

**Card 4 - Status:**
- Tabela com colunas: LABEL, COR, ACOES
- Preview visual do badge

Cada card segue o mesmo padrao visual existente (rounded-xl border bg-card).

### Etapa 4 -- Integracao com Monitoramento.tsx

Importar `useMonitoringSettings` no Monitoramento para:
- Usar as cores dinamicas de Satisfacao e Status em vez de constantes hardcoded
- Destacar palavras chave encontradas na coluna Descricao (negrito ou cor)
- Calcular Satisfacao com base nas faixas de Score configuradas

### Detalhes Tecnicos

**Arquivos a criar:**
| Arquivo | Descricao |
|---|---|
| `src/hooks/useMonitoringSettings.ts` | Hook CRUD para monitoring_settings |

**Arquivos a modificar:**
| Arquivo | O que muda |
|---|---|
| `src/pages/Configuracoes.tsx` | Nova aba "Monitoramento" com 4 cards CRUD |
| `src/pages/Monitoramento.tsx` | Usar cores e regras dinamicas do banco |

**Migracao:**
- Uma unica migracao SQL criando a tabela `monitoring_settings` + seed + RLS

**Garantias:**
- Zero alteracao nas abas existentes
- Zero remocao de funcionalidades
- Zero alteracao de layout
- Fallback mantido: se a tabela estiver vazia, valores hardcoded continuam funcionando
