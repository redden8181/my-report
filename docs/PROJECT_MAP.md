# Project Navigator — my-report
A compact routing index for Codex. Consult before opening code. Paths verified against the repository on 2026-10-25; always validate against current branch when making changes.

## Navigation / app shell
| User area or symptom | First file / symbol | Next dependency |
| --- | --- | --- |
| Tabs: Главная / Отчёт / Архив / Ещё; header; bottom dock | `src/App.tsx` — `AppShell`, `Dock`, `Header` | `src/index.css` |
| Balance card and top-up button | `src/components/HomeScreen.tsx` — `BalanceHero` | `src/components/TopupModal.tsx`, `src/store.tsx` |
| Expense category, amount, date, receipt, submit; iPhone numeric keyboard | `src/components/HomeScreen.tsx` — `ExpenseForm` | `src/utils.ts` — `parseAmount`; `src/store.tsx` — `addExpense` |
| Current transaction history on home | `src/components/HomeScreen.tsx` | `src/components/EditTransactionModal.tsx` |
| Edit/delete transaction | `src/components/EditTransactionModal.tsx` | `src/store.tsx` — `updateTransaction`, `deleteTransaction` |
| Top-up amount sheet, focus, keyboard | `src/components/TopupModal.tsx` | `src/components/ui.tsx` — `Sheet`; `src/store.tsx` |
| Current report preview and share | `src/components/ReportPreview.tsx` | `src/components/Ledger.tsx`, `src/exportExcel.ts` |
| New report / receipt audit / close period | `src/components/NewReportFlow.tsx` | `src/components/ReportPreview.tsx`, `src/store.tsx` |
| Archived reports | `src/components/ReportsHistory.tsx` | `src/components/Ledger.tsx`, `src/exportExcel.ts` |
| Ledger rows and totals | `src/components/Ledger.tsx` | `src/types.ts`, `src/utils.ts` |
| Settings and quick categories | `src/components/Settings.tsx` | `src/store.tsx`, `src/utils.ts` |
| Modal/sheet, switches, headings, toast | `src/components/ui.tsx` | `src/index.css` |
| Design tokens, typography, spacing, animation, safe areas | `src/index.css` | `src/App.tsx` |
| State, persistence, normalization, balances, report closure | `src/store.tsx` | `src/types.ts`, `src/utils.ts` |
| Money/date parsing and formatting, category defaults | `src/utils.ts` | `src/types.ts` |
| Excel workbook, download and share | `src/exportExcel.ts` | `src/utils.ts`, `src/types.ts` |
| PWA install, offline/cache | `public/manifest.json`, `public/sw.js`, `src/main.tsx` | `index.html`, `vite.config.ts` |
| Build and deployment | `package.json`, `vite.config.ts` | `.github/workflows/deploy.yml` |

## Known fast path
**iPhone expense keyboard:** `src/components/HomeScreen.tsx` → `ExpenseForm` → amount `<input>`. The native decimal keyboard issue was fixed and confirmed on device. Preserve numeric-capable input semantics and `inputMode="decimal"`. Check focus, keyboard, decimal parsing, and submit before touching other modules.

## Search escalation
1. Match user's screen/action/symptom in table.
2. Open the named file and exact symbol.
3. Inspect immediate imports and data actions only if needed.
4. If unresolved, search targeted identifiers across `src/`.
5. Read broader architecture only when the bug crosses boundaries or the map is outdated.

## Maintenance
Update affected entries whenever a component, flow, dependency or file path changes. Avoid line numbers (they drift). Never regenerate the entire map for a one-line fix.
