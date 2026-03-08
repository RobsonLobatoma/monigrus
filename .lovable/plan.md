

## Plano: Limpar grupos incorretos do banco e remover coluna TAG dos painéis

### 1. Limpar todos os grupos do banco de dados

Usar o insert tool (data operation) para deletar todos os registros da tabela `grupos`:

```sql
DELETE FROM grupos;
```

Isso remove todos os 398 grupos incorretos. Os grupos corretos serão carregados automaticamente quando o webhook receber mensagens da instância real, ou via sincronização na página Conexões.

### 2. Remover coluna TAG do Monitoramento (Global)

Em `src/pages/Monitoramento.tsx`:
- Remover import de `useTags`
- Remover `tagId` do interface `MonitoringRow` e do mapeamento de dados
- Remover `useUpdateGrupo` e `updateGrupo`
- Remover o `<th>TAG</th>` do header da tabela
- Remover o `<td>` com o `<Select>` de tags (linhas 454-476)
- Reduzir `colSpan` de 9 para 8 nos empty states
- Ajustar `<colgroup>` removendo a coluna extra

### 3. Remover coluna TAG do Hub

Em `src/pages/Hub.tsx`: a tabela do Hub já não tem coluna TAG — nenhuma mudança necessária.

### 4. Remover coluna TAG do Squads

Em `src/pages/Squads.tsx`: a tabela do Squads já não tem coluna TAG — nenhuma mudança necessária.

### 5. Limpar hook useTags (manter arquivo)

O arquivo `src/hooks/useTags.ts` e a aba Tags em Conexões continuam existindo para uso futuro, apenas removemos a referência no Monitoramento.

### Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| Banco (DELETE) | `DELETE FROM grupos` — remover todos os grupos incorretos |
| `src/pages/Monitoramento.tsx` | Remover coluna TAG, imports de `useTags`/`useUpdateGrupo`, campo `tagId` |

