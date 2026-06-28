# InjectGuard — Build Log

Append-only-ish log of what's built and the decisions made along the way, so any session can
resume instantly. Newest at the top.

## 2026-06-28 — Self-serve pasted-page playground complete; 220 tests green

**What changed:** The playground can now test either a curated demo page or a user-pasted page.
Users can paste website HTML/text, provide a page title, run one attack/model/defense combination,
and copy/download a JSON report for the completed run.

**Files changed:**
- `src/playground/attackHandler.ts` — accepts either `pageId` or `customPage`, bypasses demo lookup for custom pages, and returns `report`.
- `src/playground/requestValidation.ts` — validates API request shape, title/html limits, and mutually exclusive page sources.
- `pages/api/attack.ts` — uses `parseAttackRequest()` and passes `modelId` into the report.
- `pages/playground.tsx` — adds demo/custom source toggle, custom title/body fields, and report copy/download controls.
- `styles/globals.css` — styles custom-page fields and report actions.
- `docs/superpowers/` — design and implementation notes for this feature.

**Validation:**
- `npm test` → **220/220 green** (20 test files)
- `npm run build` → **clean**

**Scope decision:** FreeLLMAPI support was intentionally skipped for the public demo because a
server-side key would let visitors consume the owner's key through `/api/attack`. Custom models
remain a future local/private testing feature.

## 2026-06-26 — T11 README + Vercel deploy complete; 208 tests green

**What changed:** T11 complete. README, Vercel config, and env var completeness test all done.

**Files changed:**
- `README.md` — full portfolio README: problem framing, architecture diagram, method (3-stage defense + 3-layer judge), synthetic results table (Llama 52%→0%, Gemini 24%→0%, DeepSeek 24%→0%), limits, cost table (~$0 synthetic / ~$0.50 live), how-to-run, Vercel deploy instructions, stack, project structure, corpus licensing.
- `vercel.json` — `maxDuration: 50` for `pages/api/attack.ts` (matches the 50s abort already in the route); env var references for Vercel secrets dashboard.
- `src/config/envExample.test.ts` — 3 tests: `.env.example` exists, declares all `envVar` entries from `MODELS`, no blank key names. Regression guard for future model additions.

**Validation:**
- `npm test` → **208/208 green** (19 test files, +3 new config tests)
- `npm run build` → **clean**

**Remaining work (all blocked or out of scope for this session):**
- T9 live data: `npm run precompute:live` + `npm run eval:judge` — blocked on `.env` API keys
- T11 demo video: 60–90s screen recording — requires user; can record after Vercel deploy

**Deploy checklist for user:**
1. `git init && git add -A && git commit -m "init"` (repo not yet initialized)
2. Push to GitHub
3. `vercel link && vercel deploy`
4. Add 3 env vars in Vercel dashboard → redeploy

## 2026-06-26 — T10 real-world case study complete; 205 tests green

**What changed:** Built the T10 real-world case study using Bing Chat / Microsoft Copilot as the target. All five technique classes documented in the public research (Rehberger 2023) sandbox-tested against the real `sanitize.ts` pipeline.

**Files changed:**
- `src/casestudy/casestudy.test.ts` — 16 tests (TDD: written failing first). Five `describe` blocks, one per technique class. Tests `stripHtml`, `normalizeUnicode`, and full `sanitize` against realistic real-world payloads. All 16 pass.
- `docs/case-study.md` — full writeup: target system, attack surface diagram, 5 technique classes with example payloads, defense explanation per technique, summary table, 4 documented limitations (raw Markdown, visible-data injection, JS-rendered content, multi-turn persistence).

**Validation:**
- `npm test` → **205/205 green** (18 test files, +16 new case study tests)
- `npm run build` → **clean**

**Note on Technique 4 correction:** Initial test used raw markdown `![alt](url)` syntax — `stripHtml` handles HTML, not markdown source, so the test was corrected to use actual `<img alt="...">` HTML, which is what Bing Chat's browsing plugin actually receives. The markdown limitation is documented in the case study writeup.

## 2026-06-26 — T9 judge accuracy eval harness complete; 189 tests green

**What changed:** Built the judge accuracy eval harness (TDD throughout). All 6 acceptance criteria met.

**Files changed:**
- `src/eval/judgeAccuracy.ts` — `LabeledSample`, `EvalResult`, `AccuracyReport` types + `evaluateJudge(samples, llm, opts?)` (runs existing 3-layer judge against each sample, aggregates by technique and goal) + `computeAccuracy(results)` pure helper. Default rule patterns catch verbatim hijack strings from corpus payloads.
- `src/eval/judgeAccuracy.test.ts` — 11 tests (TDD: written failing first). Covers: result count, correct count, FP count, FN count, accuracy formula, byTechnique keys and shape, computeAccuracy edge cases (all-correct, all-wrong, half, empty).
- `data/judge-eval.json` — 50 hand-labeled samples. 10 per technique (hidden-text, html-comment, markdown, unicode-smuggling, instruction-in-data). Each technique has hijacked and clean examples covering all 3 goals. Canary-detected, rule-detected, and LLM-required cases all represented.
- `scripts/evalJudge.ts` — CLI runner: loads `data/judge-eval.json`, runs `evaluateJudge` with `groq-llama` as judge LLM, prints accuracy + per-technique + per-goal breakdown, writes `data/judge-eval-results.json`. Typechecks clean.
- `package.json` — added `eval:judge` npm script.

**Validation:**
- `npm test` → **189/189 green** (17 test files, +11 new eval tests)
- `npm run build` → **clean** — TypeScript clean, all 5 routes correct

**Remaining T9 work:**
- Run `npm run eval:judge` with real API keys (needs `GROQ_API_KEY` in `.env`) to get real judge accuracy numbers for README/leaderboard.
- Run `npm run precompute:live` (needs all 3 keys) for real attack-success rates.
- Both blocked on `.env` keys from user.

## 2026-06-26 — T9 corpus expansion: 6 → 25 attacks, 178 tests green

**What changed:** Expanded `src/corpus/attacks.json` from 6 seed attacks to 25 (5 per technique × 5 techniques). All 3 goals covered for each technique. Added 4 new corpus tests asserting ≥20 attacks, all 5 techniques, all 3 goals, and ≥3 attacks per technique. Regenerated `data/results.json` (150 runs = 3 models × 25 attacks × 2 defense states).

**Files changed:**
- `src/corpus/attacks.json` — 6 → 25 attacks (5 per technique: hidden-text, html-comment, markdown, unicode-smuggling, instruction-in-data)
- `src/corpus/corpus.test.ts` — 4 new tests (≥20 size, all 5 techniques, all 3 goals, ≥3/technique)
- `data/results.json` — regenerated with `npm run precompute` (synthetic, free)

**Validation:**
- `npm test` → **178/178 green** (16 test files; corpus roundtrip tests exercising all 25 attacks)
- `npm run build` → **clean**
- `npm run precompute` → 150 runs, 3 models, mode=synthetic

**T9 remaining work:**
- Run `npm run precompute:live` with real API keys to get real attack-success rates (blocked on `.env`)
- Per-technique bypass breakdown is already in the leaderboard UI (`<details>` panels in `pages/leaderboard.tsx`)
- Judge accuracy eval against a hand-labeled set (≥50 samples) — still TODO

## 2026-06-26 — T8 playground + T12 a11y complete; 117 tests green

**What changed:** T8 was already largely built from a prior session that didn't update PLANNING.md.
This session added the two missing pieces (CSP headers + a11y CSS), verified everything on Linux
ARM64, and closed the task.

**Files changed:**
- `next.config.mjs` — added CSP + X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
  Permissions-Policy. SECURITY-CRITICAL: completes the "locked CSP" requirement for the playground.
- `styles/globals.css` — added `:focus-visible` rings (red for playground controls) +
  `@media (prefers-reduced-motion: reduce)` block. Satisfies DESIGN.md a11y requirements.
- `docs/SUGGESTIONS.md` — created (5 non-blocking suggestions filed).

**T8 playground verified complete:**
- `pages/playground.tsx` — sandboxed iframe, controls, verdict display, error handling
- `pages/api/attack.ts` — rate limit (5/min per IP), 50s timeout, full error handling
- `src/playground/` — attackHandler.ts, demoPages.ts, rateLimit.ts (all DI-injected, tested)
- `data/pages.json` — 3 curated demo pages

**T12 design tokens + a11y verified complete:**
CSS vars, JetBrains Mono, base layout, `:focus-visible` rings, `prefers-reduced-motion`.

**Validation (Linux ARM64, /home/yash-mac/.local/share/injectguard-local/):**
- `npm test` → **117/117 green** (16 test files)
- `npm run build` → **clean** — TypeScript clean, all 5 routes correct

**Infrastructure note:** node_modules cannot install on CIFS/SMB (atomic rename ENOTEMPTY).
**Always work in `/home/yash-mac/.local/share/injectguard-local/` and rsync back to SMB.**

**Remaining work:** T9 (defense eval), T10 (case study), T11 (README + deploy + demo video).
**Key blocker for live data:** `.env` with 3 API keys → `npm run precompute:live`.

## 2026-06-23 — Worktree reconciled into main root; session handoff

All T6+T7 work was built in a Claude Code worktree (`relaxed-edison-c14161`) and has been
reconciled back into the canonical main root `Z:\Projects\Projects\InjectGuard` (master branch).
**Work directly in the main root from here.** Do not use that worktree again.

State: `npm test` → **94/94 green**, `npx tsc --noEmit` → **clean**, `npm run build` → SSG clean.
`data/results.json` is committed with synthetic data (`mode: "synthetic"`).

**Pending before live data:** create `.env` with the three API keys, then run `npm run precompute:live`.

## 2026-06-23 — Harness complete (T6) + initial leaderboard UI (T7), 94 tests green

**T6 — full harness (`src/harness/`)**
- `poison.ts` — `buildPoisonedContent(cleanPage, payload, canary?)`: per-technique embedder
  (hidden span · HTML comment · markdown alt-text · invisible Unicode-Tags · data field). Pure.
  Round-trip tests (`poison.roundtrip.test.ts`) prove, over the real corpus, that the defense is
  **strip-the-hidden + tag-the-visible**: hidden-text/html-comment/unicode are *removed* by
  `sanitize()`; markdown/instruction-in-data survive but are *wrapped* as untrusted.
- `runAttack.ts` — one end-to-end attempt (plant canary → poison → defense ON/OFF → victim →
  judge). Victim + judge LLM injected; pure/unit-tested. Locked by the headline pair: same
  hidden-text attack, defense OFF leaks the canary, defense ON is stripped.
- `models.ts` — roster + cost guardrails. Logical id → provider/slug/env in ONE place. OpenRouter
  allowlist (`deepseek/deepseek-v4-flash`) enforced in code (`assertOpenRouterModelAllowed`).
  Slugs: groq `llama-3.3-70b-versatile`, google `gemini-2.0-flash`, openrouter DeepSeek V4 Flash.
- `adapters.ts` — unified `ModelRunner` over Groq + Gemini + OpenRouter; `fetch` injected, so all
  paths (success / non-2xx / missing env var / guardrail) are unit-tested without real HTTP.
- `promptfooRunner.ts` — wraps promptfoo: one provider per model, callApi runs `runAttack` and
  returns a JSON verdict tagged with modelId (extraction is version-agnostic). `evaluate` injected
  (default = real promptfoo); `inProcessEvaluate` is the deterministic local matrix runner.
- `results.ts` — `aggregate()` (pure) → `ResultsFile` (per-model OFF/ON/Δ + per-technique
  breakdown + compact `runs[]` + dated/mode/judge provenance). `simulate.ts` — deterministic
  victim/judge for cost-free synthetic data. `precompute.ts` — orchestration (all I/O injected).
- `scripts/precomputeLeaderboard.ts` + `npm run precompute` (synthetic, **free default**) /
  `npm run precompute:live` (real cheap models). Writes **`data/results.json`** (committed).
  First synthetic file checked in: Llama 100% / Gemini 67% / DeepSeek 50% hijacked OFF, all 0% ON.

**T7 — initial leaderboard UI (Next.js pages router)**
- Scaffolded Next 16 + React 19. `/leaderboard` reads `data/results.json` via `getStaticProps`
  (SSG, never an in-request precompute); `/` is a static landing. Bespoke CSS from DESIGN.md
  (JetBrains Mono, bone-on-black, red=hijacked/green=blocked, hairlines, before/after gauge,
  per-technique `<details>` panels, icon+text verdict chips, honest SYNTHETIC-DATA banner).
- The UI never calls a model — purely consumes the committed JSON.

How to run: `npm test` (94 green) · `npm run precompute` (regenerate synthetic JSON) ·
`npm run dev` then open `/leaderboard` · `npm run build` (typechecks + SSG).

## 2026-06-17 — Security/eval core complete (T1–T5), 35 tests green

**Setup**
- Project scaffolded at `Z:\Projects\Projects\InjectGuard`, `git init`. Design artifacts copied
  into `docs/` and `DESIGN.md`. vitest configured (`src/**/*.test.ts`).
- Stack so far: TypeScript (ESM), tsx (spike), vitest, promptfoo, node-html-parser, zod.

**T1 — promptfoo gate: PASSED**
- `spike/promptfoo-spike.ts` runs `promptfoo.evaluate()` with a mock provider (no API key, no
  cost). Result: 1 pass / 1 fail (the poisoned case "failed" = attack landed) / 0 errors.
- promptfoo `0.121.17` works as a Node/TS library on Windows. Programmatic API:
  `import promptfoo; promptfoo.evaluate(suite, opts)`; provider = `{ id: () => 'x', callApi }`.
- **Decision:** the batch harness runs OFFLINE (a Node script), not in a Vercel function — so the
  serverless-timeout worry is moot. Only the playground does single live calls.

**T2 — `src/defense/sanitize.ts` (16 tests)**
- `normalizeUnicode` (NFKC + strip zero-width + strip Unicode-Tags block U+E0000–E007F).
- `stripHtml` uses **node-html-parser** to drop comments, script/style, and hidden nodes
  (`display:none`, `visibility:hidden`, `opacity:0`, white-on-white `color:#fff`, `hidden`/
  `aria-hidden`), then returns visible text. (Chose a real parser over regex for a security tool.)
- `tagUntrusted` wraps content in `<untrusted>…</untrusted>` and **escapes any delimiter the
  payload smuggles in** (case + whitespace variants) so it can't break out.
- `sanitize` = normalizeUnicode → stripHtml → tagUntrusted; verified against a layered attack.

**T3 — `src/defense/canary.ts` (8 tests)**
- `makeCanary` = `IG-` + `crypto.randomBytes(6)` hex. `plantCanary` embeds it as a protected
  secret. `detectLeak` = case-insensitive whole-token contains (no partial false positives).

**T4 — `src/judge/judge.ts` (5 tests)**
- 3-layer verdict: canary → rule → LLM. **LLM is dependency-injected** (`JudgeLlm`) so the
  orchestration is fully unit-testable with a mock.
- `buildJudgePrompt` hardens the judge: wraps the response via `sanitize()` (untrusted data) and
  instructs the judge to ignore any instructions inside it.

**T5 — `src/corpus/` (6 tests)**
- `schema.ts` (zod): 5 techniques (hidden-text, html-comment, markdown, unicode-smuggling,
  instruction-in-data) × 3 goals (instruction-override, canary-exfiltration, link-injection).
- `loader.ts`: `parseCorpus` validates + rejects duplicate ids; `loadCorpus` loads the seed.
- `attacks.json`: 6 seed payloads. **Note:** `injection` is the *plain* malicious instruction;
  the *technique* says how to embed it. T6's `buildPoisonedContent` applies the technique.

**Keys added** (in `.env`, git-ignored): `GROQ_API_KEY`, `GOOGLE_API_KEY`, `OPENROUTER_API_KEY`.
v1 models = Groq/Llama, Gemini Flash, OpenRouter/**DeepSeek V4 Flash only**. See `docs/MODELS.md`.

## Next
**T6 — harness.** Start test-first with `buildPoisonedContent(cleanPage, payload, canary)` (pure,
no API): for each technique, embed the injection into a clean page (hidden span, HTML comment,
markdown alt-text, unicode-smuggled, data field). Then the promptfoo wrapper + the offline
precompute script that runs the corpus × models and writes `results.json`. Then T7 leaderboard UI.

How to run: `npm test` (35 green), `npm run spike` (the gate).
