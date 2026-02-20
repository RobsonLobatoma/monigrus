
## Problem

The SATISFAÇÃO and SCORE cells are currently merged into a single grid column using a flex wrapper. However, the header has them visually separated (SATISFAÇÃO and SCORE are distinct labels). This mismatch between the 7-column header grid and the actual content causes the color blocks to appear misaligned.

Looking at the reference image:
- SATISFAÇÃO has a wide colored cell (green/yellow/red) with centered text
- SCORE has a narrower colored cell right next to it, same color, with the number centered
- They are visually adjacent but each is its own distinct column

## Root Cause

The current `COLS` constant defines 7 columns but the SATISFAÇÃO+SCORE are merged into one slot (`1.8fr`). The header row renders them as a flex row within that one cell, which works visually for the header but the colored data cells underneath don't perfectly stretch to match because they're still in a single grid column.

The real fix is to **split them into two proper grid columns** so both the header and the data rows use the exact same 8-column grid.

## Solution

### 1. Update `COLS` to 8 columns
Change from:
```
grid-cols-[90px_1.8fr_1.2fr_70px_1.8fr_100px_2fr]
```
To:
```
grid-cols-[90px_1.8fr_1.2fr_70px_1.4fr_80px_100px_2fr]
```
This gives SATISFAÇÃO its own `1.4fr` column and SCORE its own `80px` column.

### 2. Update the header row
Split the merged header flex-div into two separate `<span>` elements — one for SATISFAÇÃO and one for SCORE — each being a direct child of the grid.

### 3. Update each data row
Split the single merged `<div className={`flex ${satBg}`}>` into two separate grid cells:
- Cell 1 (SATISFAÇÃO): `<div className={`flex items-center justify-center py-4 ${satBg}`}>` with the text
- Cell 2 (SCORE): `<div className={`flex items-center justify-center py-4 ${satBg}`}>` with the number

Since both cells have the same background color class, they will appear as one continuous colored block visually, but each will be perfectly aligned with its corresponding header.

## Files to Change

- `src/pages/Hub.tsx` — update `COLS`, header row, and data row rendering for the SATISFAÇÃO/SCORE columns
