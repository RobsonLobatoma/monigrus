

## Plano: Remover botões "Grupos" e "Sincronizar" das Instâncias + Melhorar sincronização em tempo real dos painéis

### Mudanças

**1. Remover botões "Grupos" e "Sincronizar Grupos" das Instâncias Ativas**

Em `src/pages/Conexoes.tsx`:
- Remover o botão "Grupos" (ícone `Users`, linhas 331-333)
- Remover o `Popover` de "Sincronizar Grupos" (ícone `RefreshCw`, linhas 340-369)
- Remover o modal de grupos (`groupsModal` state e Dialog)
- Remover imports/hooks não utilizados: `useGetGroups`, `useSyncGroups`, `getGroups`, `syncGroups`, `groupsModal`, `handleGetGroups`, `handleSyncGroups`
- Manter a sincronização automática ao conectar (linhas 86-97 e 113-125) pois isso garante que grupos são mapeados na conexão

**2. Melhorar polling do `useGrupos` de 15s para 5s**

Em `src/hooks/useGrupos.ts`, reduzir `refetchInterval` de 15000 para 5000 para paridade com o chat (que usa 10s para mensagens).

**3. Ampliar o Realtime em `useGroupConversations` para escutar `whatsapp_message_log`**

Em `src/hooks/useGroupConversations.ts`, adicionar subscription na tabela `whatsapp_message_log` para capturar mensagens inbound imediatamente (o webhook insere lá antes de atualizar `grupos`), garantindo invalidação mais rápida.

### Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Conexoes.tsx` | Remover botão Grupos, botão Sincronizar, modal de grupos, e código associado |
| `src/hooks/useGrupos.ts` | `refetchInterval: 5_000` |
| `src/hooks/useGroupConversations.ts` | Adicionar subscription em `whatsapp_message_log` |

### Preservação
- Layout, sidebar, menus e todas as outras páginas permanecem intactos
- A sincronização automática ao conectar via QR Code é mantida
- Mock data em `Monitoramento.tsx` permanece como fallback

