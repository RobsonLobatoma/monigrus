
## Root Cause

The SATISFAÇÃO and SCORE colored cells use `py-4` padding, which means the background color only fills the inner area of the cell (not the full row height). The row height is determined by the other cells' `py-4` padding, but the colored cells need to stretch from the very top to the very bottom of the row — zero padding, full height.

The fix is a two-part approach:

1. **Remove `py-4` from colored cells** — the padding creates white space above and below the color block.
2. **Add `self-stretch` to the colored cell divs** — this makes each colored div stretch to 100% of the grid row height, ensuring the color fills completely from top to bottom.

Additionally, the row wrapper (`<div className={grid ${COLS} ...}>`) needs `items-stretch` so the grid cells actually stretch to fill the row height.

## What the Reference Image Shows

- Each SATISFAÇÃO + SCORE cell pair forms one continuous colored band across the full height of the row.
- No white gaps above or below the color.
- Text is vertically centered within the full-height colored block.
- The band goes from the top border to the bottom border of the row.

## Files to Change

**`src/pages/Hub.tsx`** — three targeted changes:

### Change 1: Row wrapper — add `items-stretch`
```
// Before
<div key={row.id} className={`grid ${COLS} border-b border-border last:border-0`}>

// After
<div key={row.id} className={`grid ${COLS} items-stretch border-b border-border last:border-0`}>
```

### Change 2: SATISFAÇÃO cell — remove `py-4`, keep `self-stretch`
```
// Before
<div className={`flex items-center justify-center py-4 ${satBg}`}>

// After
<div className={`flex items-center justify-center self-stretch ${satBg}`}>
```

### Change 3: SCORE cell — same fix
```
// Before
<div className={`flex items-center justify-center py-4 ${satBg}`}>

// After
<div className={`flex items-center justify-center self-stretch ${satBg}`}>
```

This ensures both colored cells fill the full row height with zero padding, while all other cells retain their `py-4` for proper text spacing and to define the row height.
