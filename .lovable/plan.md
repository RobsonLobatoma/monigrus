

## Plano: Interligar Hub, Squads e Monitoramento com as configuracoes dinamicas

### Problema atual

As tres paginas nao estao sincronizadas com as configuracoes do sistema:

| Configuracao          | Monitoramento (GLOBAL) | Squads | Hub do Colaborador |
|----------------------|----------------------|--------|-------------------|
| Satisfacao (cores)    | Dinamico             | Dinamico | Hardcoded        |
| Score (faixas)        | Dinamico             | Dinamico | Hardcoded        |
| Status (cores)        | Dinamico             | Dinamico | Nenhum           |
| Palavras-chave        | Dinamico             | Nenhum  | Nenhum           |

O Monitoramento GLOBAL ja e o centro do sistema e usa todas as configuracoes. O objetivo e propagar essa mesma logica para Hub e Squads.

---

### Arquivo 1: `src/pages/Hub.tsx`

**1. Adicionar imports de `useMonitoringSettings`**

**2. Carregar as 4 categorias de configuracoes:**
```
const { data: satSettings = [] } = useMonitoringSettings("SATISFACAO");
const { data: scoreSettings = [] } = useMonitoringSettings("SCORE");
const { data: statusSettings = [] } = useMonitoringSettings("STATUS");
const { data: keywordSettings = [] } = useMonitoringSettings("PALAVRA_CHAVE");
```

**3. Substituir `SAT_STYLE` hardcoded por `satStyleMap` dinamico** (mesmo memo do Monitoramento):
- Usa as cores da tabela `monitoring_settings` como base
- Fallback para cores padrao se nenhuma configuracao existir

**4. Adicionar `statusStyleMap`** para cores dinamicas dos status (igual ao Monitoramento)

**5. Substituir `mapStatusToSatisfacao` e `statusToScore` por `scoreToSatisfacao`** dinamico:
- Usa as faixas de score configuradas no banco
- Fallback: >= 71 Otimo, >= 41 Regular, < 41 Ruim

**6. Adicionar `activeKeywords`** e funcao `renderDescricao` para destacar palavras-chave na coluna Descricao

**7. Adicionar funcao `isLightColor`** para calcular contraste de texto sobre fundo colorido

**8. Atualizar a construcao de `GRUPOS`**: usar `scoreToSatisfacao(score)` em vez de `mapStatusToSatisfacao(g.status)`, e calcular score baseado em `mensagens` em vez de `statusToScore`

**9. Atualizar renderizacao da tabela**:
- Coluna SATISFACAO: usar `satStyleMap[row.satisfacao]` em vez de `SAT_STYLE[row.satisfacao]`
- Coluna STATUS: renderizar com `statusStyleMap` (badge colorido quando configurado)
- Coluna DESCRICAO: usar `renderDescricao` para highlight de keywords

---

### Arquivo 2: `src/pages/Squads.tsx`

**1. Carregar `PALAVRA_CHAVE`:**
```
const { data: keywordSettings = [] } = useMonitoringSettings("PALAVRA_CHAVE");
```

**2. Adicionar `activeKeywords` memo e funcoes `renderDescricao` / `escapeRegex`** (mesma logica do Monitoramento)

**3. Atualizar coluna DESCRICAO** na tabela "Grupos do Squad": usar `renderDescricao(row.descricao)` em vez de texto simples entre aspas

---

### Resultado

Apos estas alteracoes, qualquer mudanca feita em Configuracoes > Monitoramento (palavras-chave, cores de satisfacao, faixas de score, cores de status) sera refletida automaticamente e instantaneamente nas tres paginas, via React Query. O Monitoramento GLOBAL permanece o centro/referencia, e Hub e Squads seguem exatamente as mesmas regras.

### Detalhes tecnicos

- Todas as paginas usam `useMonitoringSettings` (React Query), que ja faz cache e invalidacao automatica
- A funcao `isLightColor` calcula se o texto deve ser preto ou branco sobre o fundo colorido
- A funcao `escapeRegex` escapa caracteres especiais para uso seguro em RegExp
- Nenhuma alteracao de banco de dados e necessaria; a tabela `monitoring_settings` ja suporta todas as categorias

