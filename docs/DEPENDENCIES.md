# Dependency and blast-radius guide

## Core flow
`src/App.tsx` selects screens and provides `StoreProvider` from `src/store.tsx`.
`src/store.tsx` owns normalized app state, transactions, reports and derived balances. `src/types.ts` defines contracts; `src/utils.ts` provides parsing, formatting, ordering and shared constants.

## Impact paths
- Expense entry: `HomeScreen.tsx / ExpenseForm` → `useStore().addExpense` → transaction list, balance, current report, ledger and Excel.
- Top-up: `HomeScreen.tsx` → `TopupModal.tsx` → `addTopup` → same balance/report consumers.
- Edit/delete: `EditTransactionModal.tsx` → store actions → recalculated transaction and report displays.
- Report: `ReportPreview.tsx` → `NewReportFlow.tsx` for receipt review/closure; `exportExcel.ts` for share/download; `Ledger.tsx` for tabular presentation.
- Archive: `ReportsHistory.tsx` consumes saved reports and shared ledger/export utilities.
- UI infrastructure: `ui.tsx` (sheets/toasts/controls) and `index.css` affect multiple screens; changing either has broad visual and iOS keyboard impact.
- PWA: `public/sw.js`, `public/manifest.json`, `index.html` and `src/main.tsx` affect installation and runtime caching.

## High-risk edits
- `store.tsx`, `types.ts`, `utils.ts`: persisted data compatibility, amount parsing, chronology, balance recalculation, period close.
- `exportExcel.ts`: column order, numeric cells, dates, report contents and sharing.
- `ui.tsx`, `App.tsx`, `index.css`: modal stacking, focus, fixed dock, safe areas and scrolling.
- `public/sw.js`: cached stale assets and update behavior.

This is an impact guide, not a complete static call graph. Inspect direct imports and current code before modifying.
