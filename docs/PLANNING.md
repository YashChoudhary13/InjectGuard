# InjectGuard — Planning

Source of truth for scope, decisions, and the task list. The full approved design doc (with the
office-hours rationale and the eng/design review reports) is `docs/design.md`.

## Goal
A portfolio flagship that lands an applied-AI / GenAI engineering job. Optimize for: (1) the AI
does something a wrapper can't, (2) measurable correctness (evals), (3) a deployed, demoable
thing with cost awareness. NOT a business.

## Scope (v1)
- ~4 weeks part-time, **hard ~$100 API cap**.
- **3 cheap models**: Groq→Llama, Gemini Flash, OpenRouter→DeepSeek V4 Flash (see `docs/MODELS.md`).
- Focus = **indirect (hidden-content) prompt injection** only.
- Headline = a **robustness leaderboard** + a **measured defense** (attack-success ON vs OFF).
- Plus one responsible **real-world case study** (analyze a real public app's injection surface
  from observation/docs — NO unauthorized attacking — propose + sandbox-test a defense).

## Locked architecture decisions
1. **Compute model:** leaderboard precomputed offline → committed `results.json` → static render.
   Only the single-attack playground calls models live (Vercel 60s limit).
2. **Harness engine:** hybrid — wrap promptfoo's TS `evaluate()`; hand-write the indirect-injection
   layer (poisoned-content builder, canary, judge, defense).
3. **Eval scope:** (a) judge accuracy vs a hand-labeled set (≥50, stratified); (b) defense
   attack-success ON vs OFF (the headline number) + per-technique bypass breakdown.
4. **Victim:** controlled harness (own realistic RAG/summarizer victim, real models via APIs) +
   one responsible real-world case study.
5. **Stack:** TypeScript. Next.js + bespoke CSS for the UI (matches the brutalist design). vitest
   for tests. promptfoo as the batch engine. node-html-parser + zod in the core.

## Baked-in requirements (from the outside-voice review)
- Sandboxed iframe + locked CSP for rendering poisoned content (SECURITY-CRITICAL).
- Each leaderboard row shows "tested {date}, model {version}".
- Playground defaults to curated cached demo pages; live-URL fetch is opt-in + budget-limited.
- Clear BIPIA (or any reused) corpus licensing, or author originals and say so.
- Writeup leads with the per-technique bypass breakdown.

## Task list & status
- [x] **T1** spike: promptfoo TS lib runs in Node/TS/Windows — PASSED (mock provider, no cost).
- [x] **T2** `defense/sanitize.ts` — unicode/html/delimiter pipeline (16 tests).
- [x] **T3** `defense/canary.ts` — plant + detect leak (8 tests).
- [x] **T4** `judge/judge.ts` — injection-resistant 3-layer judge, LLM injected (5 tests).
- [x] **T5** `corpus/` — zod schema + validating loader + 6 seed payloads (6 tests).
- [x] **T6** `harness/` — poison builder (per technique) + runAttack + model adapters
      (Groq/Gemini/OpenRouter→DeepSeek, fetch injected) + promptfoo wrapper + `aggregate()` +
      offline precompute script → **`data/results.json`** (committed). `npm run precompute`
      (synthetic, free default) / `npm run precompute:live` (real models). Slugs centralized in
      `src/harness/models.ts`.
- [x] **T7** leaderboard page — Next.js `/leaderboard`, `getStaticProps` reads `data/results.json`
      (SSG, no in-request compute); per-model OFF/ON/Δ + per-technique panels + dated/mode stamps.
      **(NEXT: T8 playground, T9 before/after eval)**
- [x] **T8** playground — cached demo pages (`data/pages.json`), sandboxed iframe/CSP render
      (`next.config.mjs` headers + `<iframe sandbox="">`), single live-attack API (`pages/api/attack.ts`),
      60s budget + rate limit. 117 tests green. 2026-06-26.
- [x] **T12** design tokens + JetBrains Mono + base layout shell + a11y primitives
      (`:focus-visible`, `prefers-reduced-motion`) in `styles/globals.css`. 2026-06-26.
- [ ] **T9** defense before/after eval (3 models × ~25 attacks) + per-technique bypass breakdown.
      Corpus expanded to 25 attacks (5/technique). Synthetic results.json (150 runs). Judge accuracy eval harness complete (189 tests, 2026-06-26).
      **Remaining:** run `eval:judge` + `precompute:live` with real API keys (blocked on `.env`).
- [x] **T10** real-world injection-surface case study + sandbox-tested defense. Target: Bing Chat / Copilot browsing. 5 technique classes, 16 tests, `docs/case-study.md`. 2026-06-26.
- [x] **T11** README + Vercel deploy config complete (2026-06-26). Demo video pending (requires user). T9 live data pending (requires API keys).

## Failure modes to keep covered (tests + handling)
- `tagUntrusted`: payload contains `</untrusted>` → must escape (DONE, tested).
- judge LLM path: judge itself gets injected → hardened prompt + sanitized input (DONE).
- playground render: poisoned HTML runs as XSS → sandboxed iframe + CSP (T8).
- playground API: fetch + model exceeds 60s → streaming/early-abort + cached pages (T8).
- leaderboard staleness → per-row tested-date + version (T7).

## NOT in scope (v1)
- Kind 3 (attacking an AI with real tools/actions) — v2.
- npm package for the defense; citable dataset for the corpus — v2.
- Running garak/PyRIT (Python) to cross-check — future work, note in README.
- Unauthorized attacks on live third-party products — out of bounds.
- Light theme — dark only.

## Parallelization (after the shared core, which is DONE)
- Lane A: harness + leaderboard precompute (`src/harness/`, `scripts/`).
- Lane B: playground UI + sandboxed render + API (`app/`, `api/`).
- Lane C: real-world case study (mostly writeup) once the defense module exists.
