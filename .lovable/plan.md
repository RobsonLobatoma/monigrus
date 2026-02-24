

## Diagnostico

Analisei os logs, o codigo e o fluxo completo. Identifiquei **3 problemas** que causam o erro ao remover e adicionar instancia:

### Problema 1: Polling continua apos deletar instancia
Quando o usuario deleta uma instancia enquanto o polling de `check-status` esta ativo (interval de 5s), o polling continua chamando `checkStatus.mutate(oldInstanceId)`. O ID antigo nao existe mais no banco, causando erro "Instance not found" que nao eh tratado e pode crashar a app.

### Problema 2: Auto-sync dispara sem `onError` handler
No `useEffect` das linhas 90-107, quando uma instancia "connecting" eh detectada, `syncGroups.mutate()` eh chamado sem `onError`. Se o sync falhar (timeout de 45s no `fetchAllGroups`), o erro propaga sem tratamento e causa o dialog "The app encountered an error".

### Problema 3: `autoCheckedRef` nunca reseta
A ref `autoCheckedRef` eh setada para `true` na primeira vez e nunca volta a `false`. Quando o usuario deleta a instancia e cria uma nova (que fica em "connecting"), o auto-check nao roda para a nova instancia porque `autoCheckedRef.current` ja eh `true`.

### Sobre o timeout de 45s no `fetchAllGroups`
Os logs confirmam que a URL esta correta (`http://...sslip.io/group/fetchAllGroups/robson`), o protocolo ja eh HTTP. O endpoint simplesmente demora demais ou trava no servidor Evolution API para instancias recem-conectadas. Isso nao pode ser corrigido no nosso lado, mas podemos tornar o fluxo resiliente.

---

## Plano de Implementacao

### Arquivo: `src/pages/Conexoes.tsx`

**Mudanca 1** — Parar polling ao deletar instancia:

```text
handleDeleteInstance (novo):
  1. Chamar stopPolling() ANTES de deletar
  2. Resetar autoCheckedRef para false
  3. Deletar instancia
  4. Toast de sucesso
```

Atualmente a linha 283 chama `deleteInstance.mutate` inline sem parar o polling.

**Mudanca 2** — Adicionar `onError` no auto-sync do useEffect:

```text
useEffect (linhas 90-107):
  syncGroups.mutate(inst.id, {
    onSuccess: ...,
    onError: (err) => {
      console.error("Auto-sync failed:", err.message);
      // Silencioso - nao mostra toast para auto-sync
    }
  });
```

**Mudanca 3** — Resetar `autoCheckedRef` quando instancias mudam:

```text
// Quando a lista de instancias muda (criacao/delecao), permitir nova auto-check
// Trocar autoCheckedRef por um estado que rastreie os IDs ja verificados
// OU simplesmente resetar autoCheckedRef quando instances.length muda
```

Usar um `Set` de IDs ja verificados em vez de boolean simples:
```text
const autoCheckedIdsRef = useRef<Set<string>>(new Set());

useEffect:
  for each connecting instance:
    if (!autoCheckedIdsRef.current.has(inst.id)):
      autoCheckedIdsRef.current.add(inst.id);
      checkStatus.mutate(inst.id, { ... });
```

**Mudanca 4** — Extrair delete handler para funcao dedicada:

```text
const handleDeleteInstance = (instanceId: string) => {
  stopPolling();
  autoCheckedIdsRef.current.clear();
  deleteInstance.mutate(instanceId, {
    onSuccess: () => toast({ title: "Instância removida" }),
    onError: (e) => toast({ title: "Erro ao remover", description: e.message, variant: "destructive" }),
  });
};
```

---

## Detalhe tecnico

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Conexoes.tsx` | Parar polling ao deletar; adicionar onError no auto-sync; usar Set de IDs em vez de boolean para autoCheck; extrair handleDeleteInstance |

## Resultado esperado

1. Deletar instancia para o polling imediatamente — sem chamadas fantasma a IDs inexistentes
2. Criar nova instancia apos deletar permite auto-check correto da nova instancia
3. Erros de sync (timeout 45s) nao crasham a app — tratados silenciosamente no auto-sync, com toast no sync manual
4. O dialog "The app encountered an error" nao aparece mais

