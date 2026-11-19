---
name: review
description: Code review gate for Wayfarer — self-review after finishing a change, or review of someone else's diff, branch or PR — with a severity-ordered checklist covering the game client, the scene engine, the backend and the visual style. Load after any code change before declaring it done, or when asked to review code in this repo. Overrides the global fallback-review skill.
---

Reviews against the global coding rules (CLAUDE.md) plus the project skills that the change touches:

- `frontend-conventions` for the game client,
- `backend-conventions` for the server,
- `wayfarer-biomes` and `docs/style-guide.md` for anything visible in the scene.

## Modes

- **Self-review (the gate after implementing):** work through every applicable section and fix issues before calling the task done. Report which items needed fixing and what changed, or say in one sentence that everything was already correct.
- **Reviewing someone else's change:** read-only. Never edit files or run commands that change anything. `git diff`, `git log` and `git show` are fine.

## Mechanics

- **Scope:** find the changed files and modules with `git diff <base>...HEAD`. Read changed files in full, not just the hunks.
- **For a PR,** also read the title, description, target branch, existing comments and the latest CI run. Anything already raised in comments is off the table; failing jobs are findings.
- **Re-read the task** and check the change does everything asked, and nothing more.
- **Very large diff** (more than about 15 files): split it into chunks for read-only subagents and merge their findings.

## Checks to run (self-review)

Run the repo's lint, type check (`tsc --noEmit`), format check, `dependency-cruiser` and the affected Vitest suites: zero new errors. Without green checks the change isn't done.

For a visual change in the scene, also look at it. Take headless Chrome screenshots of the affected biome at midday, sunset and night, in both landscape and portrait, and check them before calling it done.

## Checklist

- **Correctness:**
  - edge cases: null, empty, boundaries such as midnight, zero steps and the step cap;
  - async ordering and races;
  - no swallowed errors;
  - idempotent jobs and webhooks;
  - API contract compatibility.
- **Architecture:**
  - code is in the right module and layer;
  - imports go only inwards and only through a module's `index.ts`. Verify this by reading the diff too, because a passing tool may not cover the folder;
  - `src/shared` stays pure;
  - `scene-engine/` has no Vue imports;
  - files stay under about 500 lines.
- **Conventions:**
  - consistent with neighbouring code;
  - no `any`; string-literal unions for closed sets;
  - comments only where they explain why;
  - English in code, comments, docs and commits; Polish only in player-facing text.
- **Tests:**
  - new or changed behaviour has tests that assert behaviour, not implementation (no `wrapper.vm`);
  - fakes rather than mocks;
  - no real external APIs and no real clock;
  - boundaries covered;
  - a new route has a `fastify.inject()` test;
  - webhooks and jobs have an idempotency test;
  - critical player paths have Playwright tests.
- **UI:**
  - Atomic Design layering respected; design system `Base*` atoms used instead of raw markup, with Reka UI imported only inside adapters;
  - design tokens, not raw hex or px;
  - no inline styles except values computed at runtime;
  - copy goes through `t()` with whole sentences;
  - API errors are handled by `code`, never by showing `message`;
  - semantic, keyboard-accessible HTML;
  - works at about 400 px and in portrait.
- **Scene and visual style:**
  - follows `docs/style-guide.md`: palette by hour, multiplicative shading, light only from visible sources, grass never over the wanderer;
  - biomes pass the realism checks in `wayfarer-biomes`;
  - no Pixi objects or per-frame data in Vue reactivity;
  - geometry is rebuilt only past its margin, not every frame, unless it is small, like grass or flames;
  - respects `prefers-reduced-motion`.
- **Backend:**
  - business rules in the domain; thin routes and workers;
  - error codes from the single list;
  - a migration for every schema change;
  - the daily step budget is never lowered after the day was played;
  - cache keys are versioned and there is no duplicate cache layer.
- **Security and privacy:**
  - no secrets in the repo;
  - identity comes from the session, not from ids in requests;
  - input validated by route schemas;
  - no SQL injection and no `v-html` with user data;
  - tracker tokens encrypted;
  - only the player's region stored, never the IP.
- **Dependents:** a changed endpoint, shared type or event has every consumer checked: the game, the API tests and the E2E tests.
- **Docs:**
  - no new README-style files;
  - if a rule changed, the owning document is updated in the same change: the style guide, the brief, or a project skill.

## Response format

```
### 🔴 Critical (must fix)
1. [file:line] Violation — rule broken — how to fix (one line)

### 🟡 Important (should fix)
1. [file:line] Description — suggestion

### 🟢 Suggestions
1. [file:line] Minor improvement

### ✅ Good practices observed
- What the code does well
```

- **A clean diff:** if the diff is clean, say so explicitly. Do not invent findings.
- **Posting:** offer to post review comments on a PR, and post them only after the user agrees.
