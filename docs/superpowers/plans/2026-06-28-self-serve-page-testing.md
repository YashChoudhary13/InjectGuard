# Self-Serve Page Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let visitors paste website HTML/text into the playground and receive a structured report from the existing attack flow.

**Architecture:** Extend the playground input contract to accept either a demo page id or a custom page object. Keep attack execution in `src/playground/attackHandler.ts`; keep request validation at the API boundary; keep models server-side.

**Tech Stack:** Next.js pages router, React, TypeScript, Vitest, existing InjectGuard CSS system.

## Global Constraints

- TypeScript end to end.
- TDD is mandatory: failing test before production code.
- Do not expose API keys in the browser.
- Do not add server-side URL fetching.
- One playground run remains one model call.
- `.env` must stay ignored and uncommitted.

---

### Task 1: Extend Attack Handler Page Input

**Files:**
- Modify: `src/playground/attackHandler.ts`
- Test: `src/playground/attackHandler.test.ts`

**Interfaces:**
- Produces: `PageInput`, `CustomPageInput`, `AttackHandlerResult.report`
- Consumes: existing `runAttack`, `buildPoisonedContent`, `sanitize`

- [ ] Write failing tests for custom page input, report fields, and missing page-source validation.
- [ ] Run targeted test and confirm failure.
- [ ] Implement minimal page-source resolution and report creation.
- [ ] Run targeted test and confirm pass.

### Task 2: Validate API Request Shape

**Files:**
- Create: `src/playground/requestValidation.ts`
- Create: `src/playground/requestValidation.test.ts`
- Modify: `pages/api/attack.ts`

**Interfaces:**
- Produces: `parseAttackRequest(body): ParsedAttackRequest`
- Consumes: `AttackHandlerInput`

- [ ] Write failing validation tests for demo source, custom source, both sources, missing source, empty custom HTML, long title, and long HTML.
- [ ] Run targeted test and confirm failure.
- [ ] Implement minimal parser/validator.
- [ ] Wire API route to parser.
- [ ] Run targeted test and confirm pass.

### Task 3: Add Playground UI Controls and Report Panel

**Files:**
- Modify: `pages/playground.tsx`
- Modify: `styles/globals.css`

**Interfaces:**
- Consumes: API response report object.
- Produces: custom page form, source toggle, report JSON copy/download controls.

- [ ] Add custom page state and source toggle.
- [ ] Send either `pageId` or `customPage` in the POST body.
- [ ] Render report JSON with copy/download actions.
- [ ] Keep existing demo flow unchanged.

### Task 4: Verify and Commit

**Files:**
- All touched files.

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Confirm `git status --ignored` shows `.env` ignored.
- [ ] Commit the feature.
