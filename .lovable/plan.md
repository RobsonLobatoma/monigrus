
## Escopo da Alteração

Exclusivamente visual, restrita à coluna **STATUS** em dois arquivos:
- `src/pages/Hub.tsx` — Painel de Monitoramento (PESSOAL)
- `src/pages/Monitoramento.tsx` — Painel de Monitoramento (GLOBAL)

Nenhuma outra coluna, lógica, dado ou estilo será tocado.

---

## O que Muda

### Situação Atual
O badge STATUS usa o objeto `STATUS_STYLE` com fundo colorido sólido:
```tsx
background: stsStyle.background,  // Ex: "#22c55e", "#facc15", "#ef4444"
color: stsStyle.color,             // Ex: "#ffffff", "#000000"
```

### Situação Após
O badge STATUS passará a ter:
- Fundo: transparente (`transparent`)
- Borda: sutil cinza clara (`1px solid #E5E7EB`)
- Texto colorido conforme o estado (sem fundo):
  - RESOLVIDO → `#16A34A` (verde)
  - PENDENTE → `#D97706` (amarelo/laranja)
  - CRÍTICO → `#DC2626` (vermelho)

---

## Mudanças Técnicas

### Arquivo 1: `src/pages/Hub.tsx`

**Alterar `STATUS_STYLE`** (linhas 33–37) para usar `background: transparent` e as novas cores de texto:
```tsx
const STATUS_STYLE: Record<HubStatus, { background: string; color: string; border: string }> = {
  RESOLVIDO: { background: "transparent", color: "#16A34A", border: "1px solid #E5E7EB" },
  PENDENTE:  { background: "transparent", color: "#D97706", border: "1px solid #E5E7EB" },
  CRÍTICO:   { background: "transparent", color: "#DC2626", border: "1px solid #E5E7EB" },
};
```

**Alterar o `<span>` do STATUS** (linhas 225–238) para incluir `border` e remover `background` sólido:
```tsx
<span style={{
  display: "inline-flex",
  alignItems: "center",
  padding: "3px 10px",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  background: stsStyle.background,   // agora "transparent"
  color: stsStyle.color,             // agora cor do texto apenas
  border: stsStyle.border,           // nova borda cinza sutil
  whiteSpace: "nowrap",
}}>
```

### Arquivo 2: `src/pages/Monitoramento.tsx`

Exatamente o mesmo padrão — alterar `STATUS_STYLE` (linhas 35–39) e o `<span>` do STATUS (linhas 200–213).

---

## Garantias

- SATISFAÇÃO e SCORE: inalterados (blocos coloridos full-height)
- DATA/HORA, GRUPO, GESTOR, SQUAD, DESCRIÇÃO: inalterados
- Altura das linhas (56px), larguras das colunas, bordas de separação: inalteradas
- Lógica de filtro/busca: inalterada
- Footer com contagem de registros: inalterado
- Nenhuma funcionalidade, dado ou comportamento é afetado
