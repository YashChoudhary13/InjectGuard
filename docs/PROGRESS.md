# InjectGuard — Build Log

Append-only-ish log of what's built and the decisions made along the way, so any session can
resume instantly. Newest at the top.

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
