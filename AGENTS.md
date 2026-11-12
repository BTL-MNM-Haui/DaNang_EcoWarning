# Repository instructions

## Delivery

- Work on a feature branch and push that branch for review.
- Do not push directly to main or merge into main unless the user explicitly requests it again.
- Use meaningful commits reflecting actual changes; preserve honest commit times.

## Product constraints

- Do not implement or modify AI unless the user explicitly changes that scope.
- Preserve source observations. Conflicting values at the same timestamp remain visible and are excluded from trends with a gap.
- Do not infer unit conversion factors or choose a correct value without source evidence.
- Keep local .env files, database dumps and credentials out of Git.

## Verification

- Follow DESIGN.md for shared visual rules and docs/SKILL-REVIEW.md for recorded evidence.
- Frontend build/lint run from frontend/Danang_EcoWarning_FE.
- Browser review scripts use TASTE_SKILL_DIR to locate the installed taste-skill CDP helper.
