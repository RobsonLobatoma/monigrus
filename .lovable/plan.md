

## Diagnostico

Analisei os logs, banco de dados e codigo completo. Os problemas sao:

1. **Instancias presas em "connecting"**: Ambas as instancias (robsonn, pessoal) estao com status "connecting" no banco mas ninguem verificou o estado real na Evolution API. O `check-status` nunca foi chamado com sucesso (0 logs). O polling apos QR code nao esta funcionando corretamente.

2. **Webhook nunca recebeu eventos**: 0 logs no webhook. Mesmo com `setWebhook` configurado com sucesso, a Evolution API no IP `72.60.48.134` pode nao conseguir alcancar o URL do Supabase para enviar eventos.

3. **Tabela `grupos` vazia**: 0 registros. Como o sync-groups exige status "connected" e nenhuma instancia chegou a esse estado, os paineis de monitoramento mostram apenas dados mock.

4. **Monitoramento mostra mock data**: O codigo em `Monitoramento.tsx` (linha 164) retorna mockData quando `dbGrupos.length === 0`. Isso e esperado, mas confuso para o usuario.

### Causa Raiz
O fluxo de conexao depende do webhook da Evolution API para atualizar o status, mas o webhook nunca chega. O polling de fallback (`check-status`) deveria resolver isso, mas nao esta sendo executado efetivamente.

---

## Plano de Correcao

### 1. Connect-instance com verificacao previa de status real
**Arquivo:** `supabase/functions/whatsapp-orchestrator/index.ts`

Antes de pedir QR code, o `connect-instance` deve verificar o estado real da instancia na Evolution API via `connectionState`. Se ja estiver "open" (conectada), atualizar o banco para "connected" e retornar sem QR code. Isso resolve instancias que foram conectadas mas cujo webhook nao chegou.

```
case "connect-instance": {
  const inst = await getInst(params.instanceId);
  const { config } = await resolveProvider(inst.provider_id);
  
  // Check real status first
  try {
    const realState = await evo.connectionState(inst.instance_name, config);
    if (realState === "open") {
      await svc.from("whatsapp_instances").update({ status: "connected", qr_code: null }).eq("id", params.instanceId);
      result = { alreadyConnected: true, status: "connected" };
      break;
    }
  } catch {}
  
  // If not connected, proceed with QR code flow
  const webhookUrl = ...;
  await evo.setWebhook(...);
  const r = await evo.connect(...);
  ...
}
```

### 2. Check-status com auto-sync
**Arquivo:** `supabase/functions/whatsapp-orchestrator/index.ts`

Quando `check-status` detectar que a instancia mudou para "connected", retornar um flag `justConnected: true` para a UI saber que deve sincronizar automaticamente.

### 3. UI: Auto-check ao carregar pagina
**Arquivo:** `src/pages/Conexoes.tsx`

Ao montar a pagina, para cada instancia com status "connecting", disparar automaticamente um `check-status`. Se alguma voltar como "connected", disparar sync-groups. Isso captura conexoes que aconteceram enquanto o usuario nao estava na pagina.

### 4. UI: HandleConnect trata alreadyConnected
**Arquivo:** `src/pages/Conexoes.tsx`

Quando `connect-instance` retornar `alreadyConnected: true`, pular o QR modal e ir direto para sync de grupos com toast de sucesso.

### 5. Monitoring: Mensagem clara quando sem dados reais
**Arquivo:** `src/pages/Monitoramento.tsx`

Em vez de mostrar dados mock que confundem, mostrar uma mensagem indicando que nenhum grupo foi sincronizado ainda, com instrucao para ir a pagina de Conexoes.

---

### Resumo dos Arquivos

| Arquivo | Mudanca |
|---------|---------|
| `whatsapp-orchestrator/index.ts` | connect-instance verifica status real antes de QR; check-status retorna flag justConnected |
| `Conexoes.tsx` | Auto-check de status ao carregar; handleConnect trata alreadyConnected; auto-sync |
| `Monitoramento.tsx` | Remover mock data, mostrar mensagem de "nenhum grupo sincronizado" quando tabela vazia |

