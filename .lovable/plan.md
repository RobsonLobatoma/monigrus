
## Escopo

Apenas a célula **STATUS** nos dois arquivos:
- `src/pages/Hub.tsx` — linhas 225–240
- `src/pages/Monitoramento.tsx` — linhas 200–215

---

## O que Muda

O `<span>` do STATUS perde toda decoração e passa a ser texto simples preto:

| Propriedade | Antes | Depois |
|---|---|---|
| `border` | `1px solid #E5E7EB` | removida |
| `borderRadius` | `999px` | removido |
| `backgroundColor` | `#ffffff` | removido |
| `background` | `none` | removido |
| `padding` | `4px 10px` | removido |
| `color` | cor do status (verde/amarelo/vermelho) | `#111827` (preto) |
| `fontWeight` | `600` | `500` (normal) |

O `<span>` se torna simplesmente:
```tsx
<span style={{
  display: "inline-flex",
  alignItems: "center",
  fontSize: "11px",
  fontWeight: 500,
  letterSpacing: "0.04em",
  color: "#111827",
  whiteSpace: "nowrap",
}}>
  {row.status}
</span>
```

O objeto `STATUS_STYLE` (que só contém `color`) não é mais necessário para o texto — mas pode ser mantido ou removido. Para manter o código limpo, será removido dos dois arquivos, e a variável `stsStyle` deixará de ser declarada no `map`.

---

## Garantias

- SATISFAÇÃO e SCORE: completamente intactos
- Todas as outras colunas: sem alteração
- Layout, alturas, larguras, bordas de separação: sem alteração
- Lógica de filtro/busca: sem alteração
- Aplicado em Hub.tsx (PESSOAL) e Monitoramento.tsx (GLOBAL)
