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
- `npm test` — run the vitest suite (currently **220 tests, all green**)
- `npm run test:watch` — watch mode
- `npm run spike` — the promptfoo gate spike (T1)
- `npm run dev` — Next.js dev server (open `/leaderboard`)
- `npm run build` — Next.js production build (typechecks + SSG prerender)
- `npm run precompute` — regenerate `data/results.json` with synthetic data (free, no keys needed)
- `npm run precompute:live` — regenerate with real model calls (requires `.env` with API keys)
- `npm run eval:judge` — run judge accuracy eval against `data/judge-eval.json` (requires `GROQ_API_KEY`)

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
- ✅ **T1** promptfoo gate · ✅ **T2** sanitize · ✅ **T3** canary · ✅ **T4** judge · ✅ **T5** corpus
- ✅ **T6** harness (`src/harness/`) — poison builder · runAttack · model adapters · promptfoo wrapper · aggregate · precompute script · `data/results.json` (synthetic, committed)
- ✅ **T7** leaderboard UI (`pages/leaderboard.tsx`) — SSG via `getStaticProps`, never computes in-request
- ✅ **T8** playground (`pages/playground.tsx` · `pages/api/attack.ts` · `src/playground/`) — sandboxed iframe + CSP headers + live attack API + custom pasted-page testing + JSON report + rate limit (5/min) + 50s timeout
- ✅ **T12** design tokens + JetBrains Mono + base layout shell + a11y primitives (`styles/globals.css`)
- ⏳ **T9 (partial):** corpus expanded (25 attacks), judge accuracy eval harness complete (189 tests green). **Remaining:** run `eval:judge` + `precompute:live` with real API keys (blocked on `.env`).
- ✅ **T10** real-world case study — Bing Chat/Copilot browsing, 5 techniques, 16 tests, `docs/case-study.md`
- ✅ **T11** README + `vercel.json` + env var test — deploy-ready. Demo video pending (user records).
- ⏭️ **Remaining blockers:** T9 live data needs `.env` keys; T11 demo video needs user recording.
- 🔑 **Blocker for live data:** `.env` needs `GROQ_API_KEY`, `GOOGLE_API_KEY`, `OPENROUTER_API_KEY` → `npm run precompute:live`
- ⚠️ **Dev environment:** node_modules cannot be installed on the CIFS/SMB share. Work in `/home/yash-mac/.local/share/injectguard-local/` and rsync back.

## Repo map
```
src/defense/sanitize.ts          normalizeUnicode · stripHtml · tagUntrusted · sanitize
src/defense/canary.ts            makeCanary · plantCanary · detectLeak
src/judge/judge.ts               buildJudgePrompt · judge (3-layer, LLM injected)
src/corpus/schema.ts             zod schema (5 techniques × 3 goals)
src/corpus/loader.ts             parseCorpus (validate + dedupe) · loadCorpus
src/corpus/attacks.json          6 seed attack payloads
src/harness/poison.ts            buildPoisonedContent (per-technique embedder, pure)
src/harness/runAttack.ts         one end-to-end attack (victim + judge injected)
src/harness/models.ts            MODELS roster · assertOpenRouterModelAllowed · getModelConfig
src/harness/adapters.ts          createGroqAdapter · createGeminiAdapter · createOpenRouterAdapter · createRunnerForModel
src/harness/promptfooRunner.ts   inProcessEvaluate · makeVictimProvider · buildSuite · runHarness
src/harness/results.ts           aggregate() → ResultsFile · ModelStat · CompactRun
src/harness/simulate.ts          simulateVictim (FNV-1a, deterministic) · simulateJudge
src/harness/precompute.ts        precompute() orchestration (all I/O injected)
src/eval/judgeAccuracy.ts        evaluateJudge() · computeAccuracy() · LabeledSample · AccuracyReport
src/casestudy/casestudy.test.ts  T10: 16 sandbox tests — 5 real-world technique classes vs sanitize pipeline
scripts/precomputeLeaderboard.ts CLI: synthetic default / --live / --models / --concurrency / --out
scripts/evalJudge.ts             CLI: runs judge accuracy eval against data/judge-eval.json
data/judge-eval.json             50 hand-labeled samples (5 techniques × 10 each, hijacked + clean)
data/results.json                committed leaderboard data (synthetic; run precompute:live to refresh)
src/playground/attackHandler.ts  handleAttack (pure, deps injected) → AttackHandlerResult + report
src/playground/requestValidation.ts parseAttackRequest (demo/custom page validation)
src/playground/demoPages.ts      DEMO_PAGES · getPage — loads data/pages.json
src/playground/rateLimit.ts      makeRateLimitStore · checkRateLimit (sliding window)
pages/_app.tsx                   Next.js app shell (imports globals.css)
pages/index.tsx                  static landing page
pages/leaderboard.tsx            SSG leaderboard — getStaticProps reads data/results.json
pages/playground.tsx             playground UI — demo/custom page source + defense toggle + sandboxed iframe + verdict + JSON report
pages/api/attack.ts              POST /api/attack — rate limit + 50s timeout + model runner + judge
data/pages.json                  3 curated demo pages (recipe · security blog · headphones)
styles/globals.css               full DESIGN.md implementation (CSS vars · JetBrains Mono · gauges · focus rings · reduced-motion)
spike/promptfoo-spike.ts         T1 gate (mock provider, no cost)
next.config.mjs                  Next.js config + security headers (CSP · X-Frame-Options · etc.)
docs/                            PLANNING.md · PROGRESS.md · MODELS.md · SUGGESTIONS.md · design.md · test-plan.md · design-preview.html
DESIGN.md                        the visual design system (Instrument / Redaction)
```
