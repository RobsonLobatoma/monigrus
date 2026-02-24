

## Plan: Rename "Descrição" → "Conversas"

The search found 4 files with "Descrição" column headers. Per the user's request, we need to update only the 3 monitoring-related pages (excluding Anomalias, which is a different context):

1. **`src/pages/Monitoramento.tsx`** (line 343): Change `DESCRIÇÃO` → `CONVERSAS`
2. **`src/pages/Hub.tsx`** (line 367): Change `DESCRIÇÃO` → `CONVERSAS` (Painel de monitoramento Pessoal)
3. **`src/pages/Squads.tsx`** (line 493): Change `DESCRIÇÃO` → `CONVERSAS` (Grupo do Squad)

All changes are simple string replacements in table header `<th>` elements. No logic or data changes required.

