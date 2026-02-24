

## Diagnostico dos 3 Problemas

### Estado Atual do Banco
- 93 grupos na tabela `grupos`, todos com `last_message = null` e `last_message_at = null`
- 0 registros em `grupo_messages` (webhook nunca recebeu mensagens)
- 1 instancia ativa: "robsonn" (connected)
- Instancia deletada ("pessoal") deixou seus grupos no banco

### Problema 1: Sincronizacao nao e vinculada a instancia
A tabela `grupos` nao tem coluna `instance_id`. Quando voce sincroniza, todos os grupos sao inseridos sem referencia a qual instancia os trouxe. Quando a instancia e removida, os grupos ficam orfaos.

**Correcao:**
- Adicionar coluna `instance_id` (uuid, nullable) na tabela `grupos` via migracao
- No `sync-groups` do orchestrator, gravar `instance_id` em cada grupo sincronizado
- Monitoramento filtra apenas grupos que tenham `instance_id` de uma instancia existente

### Problema 2: Coluna "Conversas" vazia
`last_message` e `null` para todos os 93 grupos e `grupo_messages` tem 0 registros. O webhook da Evolution API nunca recebeu eventos de mensagem (problema de infra - a Evolution nao consegue alcancar o Supabase). A coluna mostra "Sem mensagens" porque nao ha dados.

**Correcao:**
- Nao depender apenas do webhook para conversas
- Durante o `sync-groups`, buscar a ultima mensagem de cada grupo via Evolution API (`/chat/findMessages/{instanceName}`) e salvar em `last_message` e `last_message_at`
- Alternativa mais leve: usar o endpoint `/group/fetchAllGroups` que ja retorna `lastMessage` no payload (se disponivel na versao da Evolution API)

### Problema 3: Dados persistem apos remover instancia
`delete-instance` apaga apenas de `whatsapp_instances` mas nao limpa os grupos associados.

**Correcao:**
- No `delete-instance` do orchestrator, apos deletar a instancia, marcar como `ativo = false` todos os grupos cujo `instance_id` seja o da instancia deletada
- Isso faz com que `useGrupos()` (que filtra `ativo = true`) automaticamente os exclua do Monitoramento

---

## Plano de Implementacao

### 1. Migracao: Adicionar `instance_id` a tabela `grupos`
```sql
ALTER TABLE grupos ADD COLUMN instance_id uuid REFERENCES whatsapp_instances(id) ON DELETE SET NULL;
```

### 2. Orchestrator: `sync-groups` grava `instance_id`
Ao inserir/atualizar cada grupo, incluir `instance_id: params.instanceId`.

### 3. Orchestrator: `sync-groups` busca ultima mensagem
Apos mapear os grupos, tentar buscar `lastMessage` do payload do `fetchAllGroups` (a Evolution API v2 retorna isso). Se disponivel, salvar em `last_message` e `last_message_at`.

### 4. Orchestrator: `delete-instance` limpa grupos
Apos deletar a instancia de `whatsapp_instances`, executar:
```sql
UPDATE grupos SET ativo = false WHERE instance_id = '<instanceId>'
```

### 5. Monitoramento: sem alteracoes necessarias
O `useGrupos()` ja filtra `ativo = true`, entao grupos de instancias deletadas desaparecem automaticamente.

---

### Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| Migracao SQL | Adicionar coluna `instance_id` em `grupos` |
| `whatsapp-orchestrator/index.ts` | sync-groups: gravar instance_id + extrair lastMessage; delete-instance: desativar grupos |
| Nenhuma mudanca no frontend | `useGrupos` e Monitoramento ja funcionam corretamente com os dados |

