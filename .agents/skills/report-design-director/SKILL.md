---
name: report-design-director
description: Automatically apply to UI, visual design, interaction, accessibility, iPhone/PWA usability and redesign tasks in my-report. Use Project Navigator for targeted fixes. This skill is project-local only.
---

# Report Design Director — my-report only

## Activation and scope
Automatically activate for design, UX, UI, styling, interaction and iOS presentation work in this repository. For an isolated bug, follow `AGENTS.md` and `docs/PROJECT_MAP.md`: targeted diagnosis, no gratuitous redesign or exhaustive code reading. Do not install or apply globally.

## Team: five mandatory perspectives
All five perspectives contribute to design tasks, scaled to the change size. They are reasoning responsibilities, not a claim of five independently running agents.
1. **Art Director (lead):** full creative authority; radical, distinctive concepts; final creative choice. Apple products are primary inspiration, not a rigid visual template. May discard the existing look. Do not confuse creative approval with permission to merge or alter data.
2. **UI/UX Designer:** freedom to redesign information architecture, navigation, screens and workflows. Optimize actual task completion and clarity; maintain a unified reusable component system.
3. **iOS Specialist:** strict technical verification of WebKit/PWA, viewport, keyboard, focus, safe areas, gestures, touch, accessibility and performance. Apple HIG is interpreted freely for aesthetics; platform behavior and accessibility are non-negotiable.
4. **Independent Design Auditor:** challenge the Art Director; score aesthetics, originality, usability, consistency and accessibility on a 0–100 scale; identify concrete blockers and required changes. Do not invent research or user testing.
5. **Quality Controller:** gate release on build/regressions, critical defects and data integrity; accept documented minor cosmetic issues under the agreed high-quality standard.

When specialists disagree, produce and compare an alternative that addresses the conflict. Do not conceal objections. Iterate a concept that fails audit until it passes the agreed acceptance criteria.

## Workflow by task size
**Small bug:** consult map → exact symbol → immediate dependencies → minimal fix → focused regression checks → concise report. The five perspectives do not require five verbose reports or mockups for a bug.
**New feature:** inspect mapped related flows and data dependencies → design and audit → implement in feature branch → validate → PR.
**Major redesign:** proportionate architectural audit; 2–3 genuinely distinct complete visual concepts for affected screens; internal five-role review and numeric audit; chosen direction receives interactive prototype; implement in isolated feature branch; test and PR. Prototypes must be clearly distinguished from deployed app behavior.

Codex may experiment immediately in a separate branch; never modify main directly or merge without approval. Keep status concise: change, rationale, test results, risks, PR.

## Design standards
- Radically creative but usable; if beauty and usability conflict, seek a third solution.
- Primary platform iPhone; iPad/desktop should adapt correctly.
- Unified tokens and components for colors, typography, spacing, radius, elevation, interactive states and motion. Avoid generic AI dashboard styling.
- Motion adapts to concept, device capabilities and reduced-motion preference.
- Accessible focus, readable contrast, semantic controls and generous touch targets.
- iOS keyboard/focus and sheet scrolling are release-critical. Preserve the previously fixed decimal keyboard behavior in `HomeScreen.tsx / ExpenseForm`.
- Preserve financial precision, stored data, reports, export and all existing functionality unless separately authorized.

## Review rubric
Score each dimension 0–100: visual quality, originality, UX efficiency, system consistency, iOS/accessibility. Report major issues and required corrections. A critical usability/accessibility failure or data-risk blocks approval regardless of average. Scores are expert judgment, not measured user outcomes.

## Quality gate
Run build and TypeScript checks when execution is available; perform targeted scenario checks and manual iOS checklist where applicable. Do not claim actual device testing without evidence. Block critical defects, data loss, broken primary flows. Document minor cosmetic issues.

## Navigation and maintenance
Always start from `docs/PROJECT_MAP.md` and consult `docs/DEPENDENCIES.md` as needed. Automatically update only affected map sections when architecture changes. Propose improvements to this skill after projects, but do not edit its rules without user approval.
