

## Diagnostico

A tabela `tags` ja existe no banco com campos `id`, `nome`, `cor`, `organization_id`. A tabela `grupos` ja tem `tag_id` (uuid, nullable). A infraestrutura de dados ja esta pronta.

O que falta:
1. Tela de gerenciamento de tags dentro de Conexoes
2. Atribuicao de tag a grupos
3. Seletor de tag no botao de sync
4. Passagem do `tagId` para a Edge Function

---

## Plano de Implementacao

### ETAPA 1 — Hook `useTags`

**Novo arquivo: `src/hooks/useTags.ts`**

CRUD de tags usando a tabela `tags` existente:
- `useTags()` — query que lista todas as tags da organizacao
- `useCreateTag()` — mutation para criar tag (nome + cor + organization_id)
- `useUpdateTag()` — mutation para editar tag
- `useDeleteTag()` — mutation para deletar tag

Precisa obter o `organization_id` do usuario logado. Buscar via `organization_members` onde `user_id = auth.uid()`.

### ETAPA 2 — Aba "Tags" na pagina Conexoes

**Arquivo: `src/pages/Conexoes.tsx`**

Adicionar uma 5a aba `<TabsTrigger value="tags">Tags</TabsTrigger>` ao `TabsList` existente.

Conteudo da aba:
- Card com formulario inline para criar tag (campo nome + seletor de cor + botao criar)
- Tabela listando tags existentes com colunas: Cor (circulo colorido), Nome, Acoes (editar/excluir)
- Edicao inline do nome e cor
- Botao de excluir com confirmacao

### ETAPA 3 — Seletor de tag no botao de sincronizar

**Arquivo: `src/pages/Conexoes.tsx`**

Substituir o botao simples de sync (linha 287) por um dropdown que contém:
- Opcao "Sincronizar todos" (sem tag)
- Lista de tags disponiveis
- Ao selecionar uma tag, chama `handleSyncGroups(inst.id, tagId)`

Usar `Popover` com lista de tags. O botao principal continua sendo o icone `RefreshCw`, mas ao clicar abre o popover com as opcoes.

### ETAPA 4 — Passar `tagId` para a Edge Function

**Arquivo: `src/hooks/useWhatsAppInstances.ts`**

Modificar `useSyncGroups` para aceitar `tagId` opcional:
```text
mutationFn: ({ instanceId, tagId }: { instanceId: string; tagId?: string }) =>
  invoke("sync-groups", { instanceId, tagId })
```

**Arquivo: `src/pages/Conexoes.tsx`**

Atualizar `handleSyncGroups` para aceitar e passar `tagId`.

### ETAPA 5 — Edge Function: aplicar `tag_id` nos grupos sincronizados

**Arquivo: `supabase/functions/whatsapp-orchestrator/index.ts`**

No case `sync-groups`, se `params.tagId` estiver presente:
- Adicionar `tag_id: params.tagId` nos inserts de novos grupos
- Adicionar `tag_id: params.tagId` nos updates de grupos existentes
- Isso permite que o sync "marque" os grupos com a tag selecionada

Se `params.tagId` for null/undefined, nao altera o `tag_id` existente.

### ETAPA 6 — Atribuicao de tag individual na tela de Monitoramento

**Arquivo: `src/pages/Monitoramento.tsx`**

Na tabela de grupos, adicionar uma coluna "Tag" com um `Select` que permite escolher uma tag para cada grupo. Ao selecionar, faz update direto via `useUpdateGrupo`.

---

## Detalhe tecnico

| Arquivo | Mudanca |
|---------|---------|
| `src/hooks/useTags.ts` | Novo hook CRUD para tabela `tags` |
| `src/hooks/useWhatsAppInstances.ts` | `useSyncGroups` aceita `{ instanceId, tagId? }` |
| `src/pages/Conexoes.tsx` | Nova aba Tags + popover no botao sync com seletor de tag |
| `supabase/functions/whatsapp-orchestrator/index.ts` | `sync-groups` aplica `tag_id` quando passado |
| `src/pages/Monitoramento.tsx` | Coluna Tag com select para atribuicao individual |

## Resultado esperado

1. Gerenciamento completo de tags (CRUD) dentro de Conexoes
2. Sincronizacao com tag opcional — marca os grupos sincronizados com a tag escolhida
3. Atribuicao individual de tag por grupo no Monitoramento
4. Tags com nome e cor visualmente distintas

