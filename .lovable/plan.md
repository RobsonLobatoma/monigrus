

## Plano: Integração em Tempo Real Evolution API com Painéis de Monitoramento

### Contexto Atual
- Os painéis (Monitoramento, Hub, Squads) exibem dados mock ou apenas `"Grupo: ${nome}"` na coluna "Conversas"
- A integração WhatsApp já existe (orchestrator + webhook) mas os dados não fluem para os painéis
- Existe 1 instância "robsonn" no Evolution API e 1 provider configurado

### Arquitetura da Solução

```text
┌──────────────┐    webhook     ┌──────────────────┐    realtime    ┌──────────────┐
│ Evolution API │ ──────────► │ whatsapp-webhook  │ ──────────── │  Frontend    │
│  (WhatsApp)   │              │ (edge function)   │              │  (painéis)   │
└──────────────┘              │  ↓ insere em      │              └──────────────┘
                               │  grupo_messages   │                     ↑
┌──────────────┐    cron/      │  + atualiza       │    useQuery +       │
│ whatsapp-    │    manual     │  grupos           │    Realtime         │
│ orchestrator │ ──────────► └──────────────────┘ ──────────────────────┘
│ (sync-groups)│
└──────────────┘
```

### Mudanças Planejadas

#### 1. Nova Tabela: `grupo_messages` (migração SQL)
Armazena as últimas mensagens recebidas por grupo WhatsApp, vinculadas à tabela `grupos`:
- `id`, `grupo_id` (FK → grupos), `instance_id` (FK → whatsapp_instances)
- `sender_name`, `message_text`, `message_type`, `received_at`
- RLS: leitura para autenticados, escrita para managers

#### 2. Novas Colunas na Tabela `grupos`
- `whatsapp_group_id` (text) — ID do grupo no WhatsApp para mapeamento
- `last_message` (text) — última mensagem recebida
- `last_message_at` (timestamptz) — timestamp da última mensagem

#### 3. Atualizar Edge Function: `whatsapp-webhook`
- Ao receber evento `messages.upsert`, extrair o texto da mensagem e o grupo de origem
- Inserir na tabela `grupo_messages`
- Atualizar `grupos.last_message` e `grupos.last_message_at` quando o grupo for mapeado
- Atualizar `grupos.status` baseado na atividade recente

#### 4. Nova Action no Orchestrator: `sync-groups`
- Chama `fetchAllGroups` na Evolution API
- Para cada grupo WhatsApp retornado, faz upsert na tabela `grupos` vinculando pelo `whatsapp_group_id`
- Atualiza `mensagens` (contagem) e `ultima_atividade`

#### 5. Novo Hook: `useGroupConversations`
- Query que busca as últimas mensagens de `grupo_messages`
- Subscreve ao Supabase Realtime para atualizações automáticas (INSERT)
- Refetch automático quando novas mensagens chegam

#### 6. Atualizar Páginas de Monitoramento
- **Monitoramento.tsx, Hub.tsx, Squads.tsx**: substituir `descricao: "Grupo: ${g.nome}"` por `g.last_message || "Sem mensagens"` 
- Usar dados reais da tabela `grupos` (last_message, status) em vez de mock
- Adicionar Realtime subscription para atualizar a tabela automaticamente sem refresh

#### 7. Habilitar Supabase Realtime
- Ativar Realtime na tabela `grupos` e `grupo_messages` para push updates

### Detalhes Técnicos

**Fluxo de dados em tempo real:**
1. Mensagem chega no WhatsApp → Evolution API envia webhook
2. `whatsapp-webhook` processa, salva em `grupo_messages`, atualiza `grupos.last_message`
3. Supabase Realtime detecta mudança em `grupos` e notifica o frontend
4. React Query invalida a cache, tabela atualiza automaticamente

**Mapeamento de grupos:**
- A action `sync-groups` conecta os grupos do WhatsApp à tabela `grupos` via `whatsapp_group_id`
- O webhook usa esse mapeamento para direcionar mensagens ao grupo correto

**Campos afetados nos painéis:**
- Coluna "Conversas": mostra `last_message` real do grupo
- Coluna "Status": atualizado com base na atividade (sem resposta há X horas → CRÍTICO)
- Coluna "Data/Hora": usa `last_message_at` real
- Score: calculado com base em métricas reais de atividade

