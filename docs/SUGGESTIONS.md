# InjectGuard — Suggestions

Non-blocking ideas that surfaced during development. Add entries here rather than derailing the current task.

## 2026-06-26 — Self-host JetBrains Mono font
- Priority: P2
- Area: design / performance
- Suggestion: Download JetBrains Mono woff2 files and serve from `/public/fonts/` instead of Google Fonts CDN.
- Why it matters: Eliminates third-party network request; allows stricter CSP `font-src 'self'` only.
- Risk if ignored: Google Fonts is a SPOF; slightly weaker CSP.
- Estimated effort: ~30 min.
- Not implemented now because: CDN is reliable for portfolio demo; P2 polish.

## 2026-06-26 — Stricter CSP `script-src` (remove `unsafe-eval`)
- Priority: P2
- Area: security
- Suggestion: Remove `'unsafe-eval'` from CSP `script-src` once Next.js nonce infrastructure is in place.
- Why it matters: `unsafe-eval` weakens XSS protection in production.
- Risk if ignored: Slightly weaker CSP; `sandbox=""` on iframe remains the primary control.
- Estimated effort: ~2h (nonce or hash extraction for Next.js).
- Not implemented now because: Next.js hydration currently requires `unsafe-eval`; complexity not justified for portfolio.

## 2026-06-26 — Canary leak indicator in playground verdict panel
- Priority: P1
- Area: design / product
- Suggestion: When `result.method === "canary"`, show a distinct "CANARY LEAKED" indicator (redaction bar + token in red), separate from the generic "✕ hijacked" chip.
- Why it matters: The canary is one of InjectGuard's distinctive mechanisms; surfacing it makes the demo more compelling for hiring managers.
- Risk if ignored: Hiring audience sees "hijacked" but misses the canary mechanism.
- Estimated effort: ~1h (playground.tsx verdict section + CSS).
- Not implemented now because: T8 base verification first; polish pass after.

## 2026-06-26 — Add high-stakes demo page (medical/financial)
- Priority: P2
- Area: eval / portfolio signal
- Suggestion: Add a "patient discharge summary" or "portfolio performance report" demo page to `data/pages.json`.
- Why it matters: Shows the attack applies to high-stakes domains, strengthening the portfolio narrative.
- Risk if ignored: Three current pages (recipe, security blog, headphones) cover basics but lack urgency.
- Estimated effort: ~30 min.
- Not implemented now because: Three pages sufficient for T8; add in T9/T10 polish pass.

## 2026-06-26 — Extract judge system prompt to shared constant
- Priority: P3
- Area: architecture / DX
- Suggestion: Move `JUDGE_SYS` from `pages/api/attack.ts` into `src/judge/prompts.ts` to share with the offline harness.
- Why it matters: Avoids divergence between playground and leaderboard judge prompts.
- Risk if ignored: Inconsistent verdicts between playground and leaderboard if prompts drift.
- Estimated effort: ~30 min.
- Not implemented now because: Minor DX issue; T8 correctness unaffected.
