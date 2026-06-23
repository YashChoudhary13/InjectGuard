# InjectGuard — Models & Cost Rules

> Read this before writing any code that calls a model. These are hard rules, not suggestions.

## Hard guardrails
1. **Cheap tiers only.** Hard spend cap **~$100 for v1**.
2. **OpenRouter is restricted to "DeepSeek V4 Flash" ONLY.** NEVER route an expensive model
   (GPT-4 / GPT-4o / Claude Opus/Sonnet / Gemini Pro / o-series / etc.) through OpenRouter.
   If code ever selects an OpenRouter model, it must be DeepSeek V4 Flash and nothing else.
3. **Cache everything.** The leaderboard is precomputed once and committed as `results.json`;
   visitor traffic must never trigger a billed model call. The playground does at most ONE live
   call per click and must be rate-limited.
4. Never hardcode keys. Read from `.env` (git-ignored). `.env.example` is the committed template.

## v1 model roster (3 cheap models on the leaderboard)
| Provider | Model | Env var | Notes |
|----------|-------|---------|-------|
| Groq | Llama (cheap/free tier) | `GROQ_API_KEY` | confirm exact slug at wire-time (e.g. `llama-3.x` instant) |
| Google | Gemini Flash | `GOOGLE_API_KEY` | cheap flash tier only — NOT Gemini Pro |
| OpenRouter | **DeepSeek V4 Flash ONLY** | `OPENROUTER_API_KEY` | slug TBD at wire-time (e.g. `deepseek/deepseek-v4-flash`); never any other model |

Slugs are now wired in code — single source of truth is **`src/harness/models.ts`** (`MODELS`):
Groq `llama-3.3-70b-versatile` · Google `gemini-2.0-flash` · OpenRouter `deepseek/deepseek-v4-flash`.
Edit them there if a slug needs changing at wire-time. The OpenRouter guardrail is enforced in code
(`assertOpenRouterModelAllowed` + the `OPENROUTER_ALLOWED_MODELS` allowlist) — a non-DeepSeek
OpenRouter model throws before any network call. Leaderboard data is committed at `data/results.json`
(`npm run precompute` = free synthetic default; `npm run precompute:live` = real billed run).

## Judge model
- The LLM-as-judge (judge.ts layer 3) should use **one cheap, reliable model** — default
  **Gemini Flash** (or DeepSeek V4 Flash). Keep the judge model FIXED across a run so verdicts
  are comparable, and **measure the judge's accuracy** against a hand-labeled set (eval T9).
- The judge is injection-resistant by construction (response is sanitized + wrapped as untrusted
  data; judge told to ignore embedded instructions) — see `src/judge/judge.ts`.

## Cost math (why the cap holds)
- Full run ≈ 3 models × ~25 attacks × defense ON/OFF + 1 judge call each ≈ a few hundred calls.
- On these cheap/free tiers that is well under the ~$100 cap. Groq has a free tier; Gemini Flash
  and DeepSeek V4 Flash are very cheap. Re-runs during dev are the main risk → cache + small
  matrices while iterating.

## Where keys live
`.env` (git-ignored) holds: `GROQ_API_KEY`, `GOOGLE_API_KEY`, `OPENROUTER_API_KEY`.
Template: `.env.example`.
