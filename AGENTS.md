# Codex operating rules — my-report

## Start here: Project Navigator
Read `docs/PROJECT_MAP.md` first. For a localized bug, open only the mapped component and direct dependencies. Expand investigation only if evidence requires it. Never read the entire repository by default. Verify paths against code; the map is a navigation aid, not ground truth.

## Task routing
- Bug, copy, minor styling: targeted fix, all relevant technical checks; no unnecessary visual concepts or full design review.
- UI/UX or design request: automatically apply `.agents/skills/report-design-director/SKILL.md`. All five roles participate, with proportional depth.
- Major redesign: multiple complete visual directions, critique, interactive prototype of chosen direction, implementation in feature branch and PR.

## Safety and Git workflow
Create a feature branch and PR for changes; do not push directly to main or merge without approval. Do not change stored data, storage keys, migrations, balances, transactions, report history, Excel output, or unrelated behavior without explicit approval. Never overwrite real user data. Never claim physical iPhone validation without testing on a device.

## Map maintenance (automatic)
After any code change that adds, removes, renames, relocates or rewires a screen, component, route, data flow or important dependency, update the affected sections of `docs/PROJECT_MAP.md` and `docs/DEPENDENCIES.md` in the same PR. If a localized fix does not change architecture, leave the maps alone. Check for map drift when navigating and correct it. Keep descriptions concise and grounded in code.

## Validation
Run `npm run build` and `npx tsc --noEmit` when an executable environment is available; add focused tests when feasible. Use `docs/REGRESSION_CHECKLIST.md` for impacted flows. Report what was actually tested and what remains for device validation.
