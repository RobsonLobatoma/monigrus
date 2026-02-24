

## Diagnóstico: Sync-Groups falhando com timeout 504

### Causa Raiz Identificada
Os logs de analytics mostram que a chamada `sync-groups` retornou **status 504** com **150.157ms de execução** (timeout de 150 segundos). Isso significa que a Edge Function não conseguiu completar a operação dentro do limite de tempo.

A causa mais provável é que o `fetch` para a Evolution API (`http://evo-uc8k4ccscosws8ksk0gs8g4k.72.60.48.134.sslip.io/group/fetchAllGroups/robsonn`) está demorando demais ou a conexão não é estabelecida a partir dos servidores da Supabase Edge (Deno). O URL usa **HTTP** (não HTTPS) e um domínio sslip.io apontando para um IP privado/local (`72.60.48.134`), o que pode causar problemas de rede a partir da infraestrutura cloud da Supabase.

Além disso, a instância está com status `connecting` (não `connected`), o que pode significar que a instância WhatsApp não está efetivamente conectada para retornar grupos.

### Plano de Correção

#### 1. Adicionar timeout ao fetch da Evolution API
Envolver todas as chamadas `fetch` do objeto `evo` com `AbortSignal.timeout()` de 25 segundos para evitar que a Edge Function fique presa esperando uma resposta que nunca chega, gerando erros mais claros em vez de timeout 504.

#### 2. Adicionar logging no sync-groups
Incluir `console.log` antes e depois de cada etapa (fetch groups, loop de upsert) para que os logs do Edge Function mostrem onde exatamente a execução trava.

#### 3. Tratamento de erro mais informativo
Quando o fetch para a Evolution API falhar (timeout, rede), retornar uma mensagem de erro clara ao frontend indicando que o servidor da Evolution API não está acessível, em vez de apenas "Failed to fetch".

#### 4. Verificação de status da instância
Antes de tentar sync-groups, verificar se a instância está com status `connected`. Se estiver `connecting` ou `disconnected`, retornar erro imediato informando que a instância precisa estar conectada.

### Detalhes Técnicos

**Arquivo afetado:** `supabase/functions/whatsapp-orchestrator/index.ts`

**Mudanças específicas:**
- Adicionar `signal: AbortSignal.timeout(25000)` em todas as chamadas `fetch` do objeto `evo`
- No case `sync-groups`, verificar `inst.status === "connected"` antes de prosseguir
- Adicionar `console.log` para debugging: antes do fetch, após receber grupos, durante o loop
- Melhorar a mensagem de erro do catch para diferenciar timeout de outros erros

**Nota importante:** O URL base do provider usa HTTP e um domínio sslip.io com IP (`72.60.48.134`). Se este IP não for acessível publicamente (ex: rede interna ou VPN), a Edge Function da Supabase nunca conseguirá se conectar. Nesse caso, seria necessário expor a Evolution API via HTTPS com um domínio público, ou usar um túnel/proxy.

