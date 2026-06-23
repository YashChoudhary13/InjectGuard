# InjectGuard — Build Log

Append-only-ish log of what's built and the decisions made along the way, so any session can
resume instantly. Newest at the top.

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
