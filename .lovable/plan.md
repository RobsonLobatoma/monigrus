

## Diagnostico

A coluna "CONVERSAS" mostra "Sem mensagens" porque:

1. **`fetchAllGroups` nao retorna mensagens** - A documentacao da Evolution API v2 confirma que o endpoint `GET /group/fetchAllGroups/{instance}` retorna apenas metadados do grupo (id, subject, creation, etc.). Os campos `lastMessage`/`last_message` que o codigo tenta extrair (linha 280 do orchestrator) nunca existem no payload.

2. **Webhooks nao estao entregando mensagens** - A tabela `grupo_messages` esta completamente vazia, indicando que o webhook `whatsapp-webhook` nao esta recebendo eventos `messages.upsert`. Provavelmente o servidor Coolify nao consegue alcançar a URL do webhook do Supabase, ou o webhook nao foi registrado corretamente na Evolution API.

3. **`last_message` e `null` em todos os 93 grupos** - Confirmado via query direta ao banco.

## Solucao

Usar o endpoint `POST /chat/findMessages/{instance}` da Evolution API para buscar a ultima mensagem de cada grupo durante o `sync-groups`. Este endpoint aceita `remoteJid` como filtro e retorna mensagens reais.

## Plano de Implementacao

### Arquivo: `supabase/functions/whatsapp-orchestrator/index.ts`

**Mudanca 1** - Adicionar novo metodo ao objeto `evo`:

```text
evo.findLastMessage(instanceName, config, remoteJid):
  POST /chat/findMessages/{instanceName}
  body: { where: { key: { remoteJid } }, limit: 1 }
  headers: { apikey, Content-Type: application/json }
  return ultima mensagem do array retornado (ou null)
```

**Mudanca 2** - Modificar o loop do `sync-groups` (linhas 274-308):

Apos o upsert do grupo, para cada grupo sincronizado, chamar `evo.findLastMessage` para buscar a ultima mensagem real. Para evitar timeout com 93 grupos, processar em batches de 5 chamadas paralelas com `Promise.allSettled`.

```text
sync-groups loop (simplificado):
  1. Upsert grupo (como ja faz)
  2. Acumular JIDs dos grupos
  3. Apos o loop de upsert, buscar mensagens em batches:
     - Para cada batch de 5 JIDs:
       - Promise.allSettled(jids.map(jid => evo.findLastMessage(...)))
       - Atualizar last_message e last_message_at no grupo correspondente
```

**Mudanca 3** - Adicionar log para diagnostico do webhook:

No final do `sync-groups`, verificar e logar se o webhook esta configurado corretamente na instancia, chamando `GET /webhook/find/{instance}` para confirmar a URL registrada.

### Detalhe tecnico sobre performance

Com 93 grupos, buscar 1 mensagem por grupo em batches de 5 = ~19 batches. Com ~200ms por chamada, ~4 segundos total. Dentro do timeout de 45s.

### Resultado esperado

- Apos sync, cada grupo tera `last_message` populado com a ultima mensagem real do WhatsApp
- A coluna "CONVERSAS" exibira o texto da mensagem em vez de "Sem mensagens"
- Webhooks continuam como mecanismo de atualizacao em tempo real (problema separado)

### Arquivos modificados
| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/whatsapp-orchestrator/index.ts` | Adicionar `evo.findLastMessage`, modificar `sync-groups` para buscar ultima mensagem por grupo via `findMessages` |

