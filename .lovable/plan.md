

## Diagnostico

O `sync-groups` atual (linhas 281-385) faz tudo em uma unica chamada:
1. `fetchAllGroups` — retorna TODOS os grupos de uma vez (payload enorme com ~1000 grupos)
2. Loop sequencial com 1 query por grupo (1000 queries individuais ao banco)
3. `findChats` — outro payload enorme
4. Loop sequencial para atualizar mensagens

Com ~1000 grupos isso facilmente estoura o timeout de 45s da Edge Function e o limite de execucao do Supabase.

## Solucao

Implementar sincronizacao em batches **dentro da mesma Edge Function**, sem criar tabelas novas desnecessarias. A tabela `grupos` ja tem todos os campos necessarios (`ativo`, `last_message_at`, `instance_id`). Nao precisa de `whatsapp_groups` nem `sync_progress` — isso adicionaria complexidade sem resolver o problema real.

O problema real eh:
1. O loop faz 1 query por grupo (N queries) — resolver com **upsert em batch**
2. O payload do `fetchAllGroups` pode ser grande mas eh uma unica chamada HTTP — isso nao causa timeout
3. O processamento sequencial de ~1000 grupos no banco causa timeout — resolver com batches de INSERT/UPDATE

---

## Plano de Implementacao

### Arquivo: `supabase/functions/whatsapp-orchestrator/index.ts`

**Mudanca 1** — Reescrever o case `sync-groups` para processar em batches de 50 grupos usando `upsert` em vez de queries individuais:

```text
sync-groups reescrito:

1. Buscar todos os grupos da Evolution API (1 chamada — inevitavel)
2. Buscar todos os grupos existentes no banco para esta instancia (1 query)
3. Dividir grupos da API em batches de 50
4. Para cada batch:
   a. Separar em "existentes" (update) e "novos" (insert)
   b. Fazer upsert em batch via Supabase (1-2 queries por batch, nao 50)
   c. Acumular mapa jid→id
5. Buscar chats (findChats — 1 chamada)
6. Atualizar last_message em batches de 50
7. Verificar webhook
```

Isso reduz de ~1000 queries individuais para ~40 queries em batch (20 batches × 2 ops).

**Mudanca 2** — Adicionar early timeout protection:

```text
const startTime = Date.now();
const MAX_EXEC_MS = 40000; // 40s — deixar 5s de margem

// Em cada iteracao de batch:
if (Date.now() - startTime > MAX_EXEC_MS) {
  console.log(`[sync-groups] Time limit reached at batch ${i}`);
  break; // Salva o que ja processou
}
```

**Mudanca 3** — Buscar grupos existentes em uma unica query em vez de N queries individuais:

```text
// ANTES (1 query por grupo):
for (const wg of waGroups) {
  const { data: existing } = await svc.from("grupos").select("id, gestor").eq("whatsapp_group_id", jid).maybeSingle();
}

// DEPOIS (1 query total):
const { data: allExisting } = await svc.from("grupos")
  .select("id, gestor, whatsapp_group_id, nome")
  .eq("instance_id", inst.id);
const existingMap = new Map(allExisting?.map(g => [g.whatsapp_group_id, g]) || []);
```

**Mudanca 4** — Usar batched updates em vez de updates individuais para mensagens:

```text
// Em vez de 1 update por grupo para last_message:
// Acumular e fazer updates em batch de 50
```

### Nenhuma mudanca de schema necessaria

A tabela `grupos` ja tem `ativo`, `last_message`, `last_message_at`, `instance_id`. Nao eh necessario criar tabelas novas. Tags e filtros de ativo/inativo podem ser adicionados depois como feature separada — o problema imediato eh o timeout.

### Nenhuma mudanca no frontend

O frontend ja chama `syncGroups.mutate(instanceId)` e exibe o resultado. A resposta continua sendo `{ synced, total, messagesFound }`.

---

## Detalhe tecnico

| Arquivo | Mudanca |
|---------|---------|
| `supabase/functions/whatsapp-orchestrator/index.ts` | Reescrever `sync-groups`: pre-carregar existentes em 1 query, processar em batches de 50 com upsert, timeout protection de 40s, batch updates para mensagens |

## Resultado esperado

1. Sincronizacao de ~1000 grupos completa em <40s (vs timeout atual)
2. ~20 queries ao banco em vez de ~1000
3. Se atingir o limite de tempo, salva o progresso parcial
4. Sem mudancas no banco ou frontend
5. Mesma API, mesma resposta, mesma UX

