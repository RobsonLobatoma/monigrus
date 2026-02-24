

## Problema

Existem 93 grupos na tabela `grupos` com `instance_id = NULL` e `ativo = true`. Esses grupos foram sincronizados antes da coluna `instance_id` ser adicionada. O `delete-instance` tenta desativar grupos com `.eq("instance_id", instanceId)`, mas como todos têm `instance_id = NULL`, nenhum é afetado.

## Plano

### 1. Limpeza imediata dos dados orfãos (SQL UPDATE)
Executar um UPDATE para marcar como `ativo = false` todos os grupos que têm `instance_id IS NULL`. Esses são dados orfãos que não pertencem a nenhuma instância ativa.

```sql
UPDATE grupos SET ativo = false WHERE instance_id IS NULL;
```

### 2. Proteção no `useGrupos` hook
Adicionar filtro adicional no hook `useGrupos` para garantir que apenas grupos com `instance_id` preenchido (vinculados a uma instância existente) sejam retornados. Isso previne que dados orfãos apareçam no Hub ou no Monitoramento, mesmo que `ativo` esteja `true` por engano.

**Arquivo:** `src/hooks/useGrupos.ts`
- Adicionar `.not("instance_id", "is", null)` na query

### 3. Proteção no `delete-instance` do orchestrator
Além de desativar por `instance_id`, também verificar se a instância que está sendo deletada tem grupos sem `instance_id` mas com o mesmo `whatsapp_group_id`. Isso cobre cenários de dados migrados.

**Arquivo:** `supabase/functions/whatsapp-orchestrator/index.ts`  
- Manter a lógica existente (já correta para dados novos)

---

### Resultado esperado
- Os 93 grupos orfãos desaparecem imediatamente dos painéis (Global e Pessoal)
- Futuras sincronizações gravam `instance_id` corretamente
- Futuras remoções de instância limpam os grupos associados
- O hook `useGrupos` nunca retorna grupos sem instância vinculada

