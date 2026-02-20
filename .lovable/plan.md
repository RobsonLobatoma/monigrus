
## Diagnóstico Real

O código já tem `background: "transparent"` no `STATUS_STYLE`, então o problema **não é o `STATUS_STYLE`**. O problema é que o `<span>` do badge com `background: "transparent"` herda a cor do elemento pai (`<td>` → `<tr>` → `<tbody>` → `bg-card`). Dependendo do tema (claro/escuro), isso pode aparecer como uma tonalidade suave ao invés de branco puro visível.

A solução definitiva é usar **`backgroundColor: "#ffffff"`** (branco puro explícito) no `<span>` do STATUS, combinado com os outros ajustes visuais solicitados:
- `borderRadius: "999px"` (pill, em vez de `6px`)
- `padding: "4px 10px"`
- `fontWeight: 600`
- `border: "1px solid #E5E7EB"`

## Arquivos Afetados

Apenas **dois arquivos**, apenas a célula STATUS:
- `src/pages/Hub.tsx` — linha 225–239
- `src/pages/Monitoramento.tsx` — linha 200–214

## Mudanças Exatas

### Em ambos os arquivos — o `<span>` do STATUS passa de:
```tsx
<span style={{
  display: "inline-flex",
  alignItems: "center",
  padding: "3px 10px",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  background: stsStyle.background,   // "transparent" — herdava cor do pai
  color: stsStyle.color,
  border: stsStyle.border,
  whiteSpace: "nowrap",
}}>
```

### Para:
```tsx
<span style={{
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.04em",
  backgroundColor: "#ffffff",        // branco puro explícito, sem herança
  background: "none",                // cancela qualquer background shorthand
  color: stsStyle.color,
  border: "1px solid #E5E7EB",       // borda cinza sutil fixa, sem depender do objeto
  whiteSpace: "nowrap",
}}>
```

### O `STATUS_STYLE` também é simplificado para remover o campo `background` (não é mais necessário):
```tsx
const STATUS_STYLE: Record<HubStatus, { color: string }> = {
  RESOLVIDO: { color: "#16A34A" },
  PENDENTE:  { color: "#D97706" },
  CRÍTICO:   { color: "#DC2626" },
};
```

## Garantias

- SATISFAÇÃO e SCORE: completamente intactos (blocos coloridos full-height)
- Todas as outras colunas: sem alteração
- Lógica de filtro/busca: sem alteração
- Layout, altura das linhas (56px), larguras de colunas: sem alteração
- Aplicado em Hub.tsx (PESSOAL) e Monitoramento.tsx (GLOBAL)
