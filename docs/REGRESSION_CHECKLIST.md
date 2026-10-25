# Focused regression checklist

Run only relevant checks for localized fixes, plus the build/typecheck when available. For a redesign, run the entire applicable checklist. Record PASS / FAIL / NOT TESTED honestly.

## Expense and balance
- Expense amount field opens decimal-capable keyboard on a physical iPhone (manual device test).
- Valid decimal input parses correctly; invalid/zero input is rejected; Enter/submit does not duplicate a transaction.
- Category selection/custom category, date (today/yesterday/custom), receipt flag and balance after expense work.
- Top-up sheet opens, focus/keyboard works on iPhone, amount is saved once.
- Edit/delete transaction updates balances and list without losing other entries.

## Reports and storage
- Current report shows correct chronological transactions and totals.
- Receipt audit and close-report flow preserve historical transactions.
- Archive opens existing reports and shows correct totals.
- Excel exports correct dates, amounts, signs, columns and receipt flags; share/download works on supported devices.
- Reload preserves stored data; no storage-key/schema changes or destructive resets.
- Confirm any import/export or migration behavior touched by a change.

## iOS and accessibility
- Keyboard does not cover active input or submit; focus stays predictable in sheets.
- Bottom dock and sheets respect safe-area inset; no accidental horizontal scroll at narrow widths.
- Tap targets, contrast, labels, disabled and error states are usable.
- Reduced-motion preference is respected where animations are present.
- PWA launched from Home Screen behaves as expected; cache refresh after deploy when relevant.

## Build
- `npm run build`
- `npx tsc --noEmit`
- Automated tests if available; `package.json` currently has no test script.
- Physical iOS checks must be marked NOT TESTED unless actually performed.
