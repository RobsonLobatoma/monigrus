
## Problem Analysis

Looking at the current code and the reference image carefully:

**Current approach (CSS Grid divs):** The table uses `<div>` elements with CSS grid. The colored SATISFAÇÃO and SCORE cells use `self-stretch` which is supposed to make them fill the row height — but CSS grid children with `self-stretch` do NOT reliably propagate `height: 100%` down to nested flex children. The colored `<div>` becomes the grid item itself, so the background should cover the full cell area... BUT the issue is that the grid row height is set by cells with `py-4` padding, and without a fixed height, browsers sometimes don't stretch grid items consistently.

**What the reference image shows:**
- SATISFAÇÃO: wide colored block (green/yellow/red), text centered, fills full row height
- SCORE: narrower colored block same color, number centered, fills full row height  
- STATUS: small colored badge/pill (not full-height block) with text like "RESOLVIDO", "PENDENTE", "CRÍTICO"
- No white gaps above or below the colored cells

**Root Cause:** The CSS Grid `self-stretch` approach is unreliable for full-height background fills because:
1. The grid auto row height is implicit — not a fixed value
2. `self-stretch` stretches the grid item box, but without `height: 100%` on the flex container inside, the background may not fill consistently
3. There's no explicit row height defined

## Solution: Convert to a Real `<table>` Element

The user's spec explicitly requests table semantics (`<tr>`, `<td>`, `<th>`). A real HTML table solves all height problems natively because:
- `<tr>` height is uniform across all cells in the row
- `<td>` with `height: 100%` and `padding: 0` + a full-height inner `<div>` fills perfectly
- `border-collapse: collapse` ensures no double borders

## Exact Changes to `src/pages/Hub.tsx`

### 1. Remove the `COLS` grid constant
No longer needed — column widths will be defined with fixed pixel/percentage widths on `<th>` and `<td>` elements using inline `style` props or Tailwind width classes.

### 2. Add inline CSS constants for status colors
```tsx
const SAT_STYLE: Record<Satisfacao, { background: string; color: string }> = {
  Ótimo:   { background: "#22c55e", color: "#ffffff" },
  Regular: { background: "#facc15", color: "#000000" },
  Ruim:    { background: "#ef4444", color: "#ffffff" },
};

const STATUS_STYLE: Record<HubStatus, { background: string; color: string }> = {
  RESOLVIDO: { background: "#22c55e", color: "#ffffff" },
  PENDENTE:  { background: "#facc15", color: "#000000" },
  CRÍTICO:   { background: "#ef4444", color: "#ffffff" },
};
```

Note from the reference image: STATUS also has a small colored badge/pill style — matching the same color scheme.

### 3. Replace the entire grid-div table with a real `<table>`

**Table wrapper:**
```tsx
<div className="rounded-xl border border-border bg-card overflow-hidden">
  <table style={{ borderCollapse: "collapse", width: "100%" }}>
```

**Header row `<thead>`** with fixed column widths:
```
DATA/HORA | GRUPO | GESTOR DE TRÁFEGO | SQUAD | SATISFAÇÃO | SCORE | STATUS | DESCRIÇÃO
  90px      1.8fr    1.2fr              70px    140px        80px    130px    auto
```

**Data rows `<tbody>`** with `<tr style={{ height: "56px" }}>` and:
- Regular cells: `<td style={{ padding: "0 12px", verticalAlign: "middle" }}>`
- Colored cells (SATISFAÇÃO, SCORE): `<td style={{ padding: 0, height: "100%" }}>` with inner `<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", fontWeight: 600, background: "...", color: "..." }}>`
- STATUS cell: same pattern with a smaller pill-style badge

### 4. STATUS column

Looking at the reference image, the STATUS column shows small colored pill/badge labels (e.g. green "RESOLVIDO", yellow "PENDENTE", red "CRÍTICO") — NOT a full-height colored block. So STATUS uses a badge `<span>` with padding and border-radius, not a full-height div.

## Summary of Visual Result

```text
┌──────────┬──────────────────┬──────────────┬───────┬────────────┬───────┬──────────┬──────────────────────────┐
│ DATA/HORA│ GRUPO            │ GESTOR       │ SQUAD │ SATISFAÇÃO │ SCORE │ STATUS   │ DESCRIÇÃO                │
├──────────┼──────────────────┼──────────────┼───────┼────────────┼───────┼──────────┼──────────────────────────┤
│27/12/2026│ Dr. Silva...     │ Seu Madruga  │ SQT1  │   Ótimo    │  98   │RESOLVIDO │ "Cliente confirmou..."   │
│  05:15   │                  │              │       │ [GREEN BG] │[GREEN]│[grn pill]│                          │
├──────────┴──────────────────┴──────────────┴───────┴────────────┴───────┴──────────┴──────────────────────────┤
```

The colored cells (SATISFAÇÃO and SCORE) fill 100% of the 56px row height. STATUS shows a small colored badge.

## Files to Change

- **`src/pages/Hub.tsx`** — full rewrite of the table section from grid-divs to a proper HTML `<table>` with inline styles for pixel-perfect control. No logic, data, filtering, or search changes.
