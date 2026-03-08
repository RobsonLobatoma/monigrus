

## Plano: Ativar todos os 393 grupos restantes e vinculá-los à instância conectada

### Problema

Dos 398 grupos no banco, apenas 5 estão com `ativo = true` e `instance_id` preenchido. Os outros 393 têm `ativo = false` e `instance_id = NULL` — a migração anterior só ativou grupos que já tinham `instance_id`, ignorando a maioria.

Todos os 393 grupos possuem `whatsapp_group_id` válido, confirmando que são grupos reais da instância "lobato" (`af1606c4-3d53-423e-bfda-c283265f6c64`).

### Correção

**1. Migration SQL** — Vincular e ativar todos os grupos:
```sql
UPDATE grupos 
SET ativo = true, 
    instance_id = 'af1606c4-3d53-423e-bfda-c283265f6c64'
WHERE ativo = false 
  AND whatsapp_group_id IS NOT NULL;
```

Isso ativará os 393 grupos restantes e os vinculará à instância conectada, totalizando 398 grupos visíveis nos painéis.

### Arquivo modificado

| Arquivo | Mudança |
|---------|---------|
| Nova migration SQL | `UPDATE grupos SET ativo = true, instance_id = '...'` para os 393 grupos |

