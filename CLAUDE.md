# InjectGuard — Claude Code Project Memory

> **New session? Read in this order:** this file → `docs/PROGRESS.md` (exactly where we
> are) → `docs/PLANNING.md` (the plan & task list). Visual system: `DESIGN.md`. Model
> rules & keys: `docs/MODELS.md`. Full approved design doc (concept + reviews): `docs/design.md`.

## What this is
InjectGuard is an **indirect prompt-injection lab + model robustness leaderboard**. It plants
hidden attacks inside the web pages an AI reads, measures how often each model gets hijacked,
and proves a defense that stops it.

**Why it exists (do not lose this framing):** it is a **portfolio flagship to land an applied-AI /
GenAI engineering job — not a business.** Every decision optimizes for hiring signal:
evals/measurement, security depth, a deployed demo. (Pivoted from a now-dead project, REVO.)
The builder is a CS undergrad, strong in TypeScript, weak in Python — **stay in TypeScript.**

## Commands
- `npm test` — run the vitest suite (currently **35 tests, all green**)
- `npm run test:watch` — watch mode
- `npm run spike` — the promptfoo gate spike (T1)
- Next.js dev/build scripts get added in T7/T8 (UI not scaffolded yet)

## Conventions (follow these)
- **TDD is mandatory.** Write the failing test first, watch it fail for the right reason, then
  the minimal code to pass. The entire core was built this way. No production code without a
  failing test first.
- **TypeScript end to end.** No Python.
- **Design system = `DESIGN.md`** ("Instrument / Redaction"): JetBrains Mono only; warm bone
  ink `#E9E4D8` on near-black `#08090B`; **red `#FF453A` = hijacked/signature**, **green
  `#35C26B` = blocked**; film grain; redaction motif. All animation is **transform/opacity only**
  (60fps) and honors `prefers-reduced-motion`. Attack-outcome states use **icon + text, never
  color alone.** Canonical visual reference: `docs/design-preview.html`.
- Small, single-purpose modules. Match existing style.

## Architecture (locked — see docs/PLANNING.md for the why)
- **Leaderboard is PRECOMPUTED offline** by a script → committed `results.json` → the site
  renders it statically. NEVER compute the full leaderboard inside a serverless request
  (Vercel free tier kills requests at 60s).
- **Playground = ONE live attack** per click (fits the 60s budget).
- **Harness = hybrid:** wrap **promptfoo**'s TS `evaluate()` to run attacks across models; we
  hand-write the indirect-injection layer (poisoned-content builder, canary, judge, defense).
  T1 proved promptfoo runs as a Node/TS library on this Windows box.
- **Judge = injection-resistant, 3 layers** (canary → rule → hardened LLM). The response under
  review is sanitized + wrapped as untrusted data; the judge is told to ignore instructions in it.
- **Defense pipeline order:** `normalizeUnicode` → `stripHtml` → `tagUntrusted`.
- **Sandboxed rendering (SECURITY-CRITICAL):** the playground must render poisoned content ONLY
  in a sandboxed iframe + locked CSP (or server-side render-to-image). Never inject raw HTML
  into the page — that would be an XSS hole inside a security tool.

## Models & cost — READ `docs/MODELS.md` BEFORE ANY MODEL CALL
- **Cheap tiers only. Hard spend cap ~$100 for v1.** Cache every result.
- v1 roster (3 cheap models): **Groq → Llama**, **Google → Gemini Flash**, **OpenRouter → DeepSeek V4 Flash**.
- **OpenRouter: ONLY "DeepSeek V4 Flash". NEVER route an expensive model (GPT-4 / Claude Opus /
  etc.) through OpenRouter.** Hard guardrail.
- Keys are in `.env` (git-ignored): `GROQ_API_KEY`, `GOOGLE_API_KEY`, `OPENROUTER_API_KEY`.

## Status (keep this current as you work)
- ✅ **T1** promptfoo gate · ✅ **T2** sanitize · ✅ **T3** canary · ✅ **T4** judge · ✅ **T5** corpus — **35 tests green**.
- ⏭️ **Next: T6** harness — `buildPoisonedContent(cleanPage, payload, canary)` applies each
  technique → promptfoo wrapper → offline precompute script → `results.json`. Then T7 leaderboard
  UI, T8 playground, T9 before/after eval, T10 case study, T11 README/deploy/demo, T12 design shell.

## Repo map
```
src/defense/sanitize.ts   normalizeUnicode · stripHtml · tagUntrusted · sanitize
src/defense/canary.ts     makeCanary · plantCanary · detectLeak
src/judge/judge.ts        buildJudgePrompt · judge (3-layer, LLM injected)
src/corpus/schema.ts      zod schema (5 techniques × 3 goals)
src/corpus/loader.ts      parseCorpus (validate + dedupe) · loadCorpus
src/corpus/attacks.json   seed attack payloads
spike/promptfoo-spike.ts  the passing T1 gate
docs/                     PLANNING.md · PROGRESS.md · MODELS.md · design.md · test-plan.md · design-preview.html
DESIGN.md                 the visual design system (Instrument / Redaction)
```
