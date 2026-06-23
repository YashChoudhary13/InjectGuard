# Design System — InjectGuard ("Instrument / Redaction")

> Belongs in the InjectGuard repo root. Copy to `<injectguard-repo>/DESIGN.md` when scaffolded.
> Canonical visual reference: `preview-final.html` (in this folder).

## Product Context
- **What this is:** an indirect-prompt-injection lab + model robustness leaderboard. Plants attacks inside pages an AI reads, measures how often each model is hijacked, and proves a defense that stops it.
- **Who it's for:** applied-AI hiring managers and engineers (technical audience).
- **Space:** AI security / LLM red-teaming. Peers: promptfoo, Lakera, Greptile, LLM leaderboards.
- **Project type:** HYBRID — brutalist hero + leaderboard (landing) and a playground (app UI).
- **Memorable thing:** "An AI obeyed an instruction you couldn't even see — and this person measured exactly how often." Every decision serves this.

## Aesthetic Direction
- **Direction:** Instrument / Redaction — brutalist-minimalist, terminal-grade, classified-document. Exposed structure, hairline rules, monospace everything, raw but precise.
- **Concept:** redaction. The page treats the attack like a classified document: black redaction bars hide the malicious instruction; revealing them (hover / tap / keyboard) peels the bar to show the payload in red. The design argues the product's idea (invisible -> visible) rather than decorating around it.
- **Decoration:** texture, not ornament. Film grain (~5% SVG noise) + a vignette + faint scanlines on panels + corner registration marks. NO glowing tech grid, NO blobs, NO gradients-as-decoration.
- **Mood:** a serious security instrument an engineer trusts and uses daily.
- **References:** Greptile (brutalist-minimalist), Artificial Analysis / LMArena (dense dated tables), terminal/CLI tooling.

## Typography
- **System:** single family — **JetBrains Mono** (the skill's "Terminal CLI Monospace" system, explicitly for security tools). No sans-serif anywhere. This is the deliberate antidote to the generic-AI sans default.
- **Display/Hero:** JetBrains Mono 800, uppercase, letter-spacing -0.045em, line-height 0.94, oversized + broken across lines (editorial brutalism).
- **Body/UI/labels:** JetBrains Mono 400/500. Labels uppercase, letter-spacing 0.14-0.22em.
- **Data/numbers:** JetBrains Mono with `font-variant-numeric: tabular-nums` so columns and gauges never shift.
- **Loading:** Google Fonts `JetBrains+Mono:ital,wght@0,400;0,500;0,700;0,800;1,400`. Self-host for production.
- **Scale (px):** 10/11 (mono labels) · 13 · 14 · 15 (body) · 16 (lede) · clamp(44,8vw,100) (hero). Keep sizes discrete.

## Color
- **Approach:** restrained + semantic. Red is the signature (it IS the threat); green is reserved for "blocked". No cyan (the v1 cliche), no purple.
- **Tokens (CSS vars):** `--bg #08090B` · `--bg2 #0E0F13` · `--line #23252B` · `--line2 #15171B` · `--ink #E9E4D8` (warm bone, not cold white) · `--mut #827E72` · `--faint #4A4840`.
- **Semantic:** danger/hijacked `--red #FF453A` · safe/blocked `--grn #35C26B` · warn `--amber #E0A33E`.
- **Color language:** red = vulnerable/hijacked + brand signature; green = defended/blocked; warm bone = voice. Never use red/green decoratively.
- **Dark mode:** dark-native, the only theme for v1. No light theme until v2.
- **A11y:** attack outcomes never rely on color alone — always icon + text (✓ Safe / ✕ Hijacked). All text verified >=4.5:1 on its surface.

## Spacing
- **Base:** 4px. Scale 4 · 8 · 12 · 16 · 22 · 28 · 48 · 68/78.
- **Density:** hero spacious; leaderboard rows ~15px padding; panels comfortable. Hairline (1px) rules instead of card boxes.

## Layout
- **Approach:** editorial brutalist. Asymmetric hero (content + 230px blueprint spec-rail on >=820px). Left-aligned, grid-disciplined data table, two-pane diff playground.
- **Max width:** 1120px. Gutters 28px.
- **Border radius:** 0 everywhere (sharp). Borders are visible hairlines.
- **Corner registration marks** frame the viewport (classified-document motif).

## Motion (all GPU-composited: transform / opacity only)
- **Continuous (cheap):** ticker marquee (`translateX`, ~46s, pauses on hover), cursor blink (opacity), live-dot pulse.
- **One-shot on load:** hero scanner sweep (`translateY`), gauge bars fill (`scaleX`), one auto-peel of the hero redaction, a single "decode" scramble on the word SEE.
- **On scroll:** sections fade-up (`translateY`+opacity) via IntersectionObserver.
- **On interact:** redaction peel (`scaleX`), button hover invert, row hover tick.
- **Rules:** never animate layout properties (top/left/width/height); use transform/opacity. `will-change` only on the few moving elements. Easing: enter ease-out / `cubic-bezier(.2,.7,.2,1)`; exit faster. Fully honor `prefers-reduced-motion` (gauges snap full, no sweep/scramble/ticker/reveal).

## Component Vocabulary
- **System status bar:** sticky, hairline border, brand + lab tag + live pulse + build/run stamps. Mono uppercase.
- **Attack ticker:** thin streaming feed of `attack-id › model › BLOCKED/HIJACKED` (green/red), pauses on hover.
- **Redaction:** `<span class="redact">` solid bar (toner-rough edge) over hidden payload; reveals red text on hover/click/Enter. Keyboard-operable, focus ring. The signature element + interaction.
- **Before/after gauge:** two thin tracks (defense OFF red, ON green) filling via scaleX with tabular % values.
- **Leaderboard:** rank numerals (01/02/03), rank-01 gets a red edge tick + red numeral; per-model sparkline (SVG polyline); blocked% (green) / hijacked% (red) / Δ30d / tested date; summary readout line above; hairline rows, hover tick.
- **Verdict chip:** outlined tag, SVG icon + text (✓ Safe / ✕ Hijacked), never color alone.
- **Blueprint spec-rail:** monospace pipeline diagram (page → model → output → judge) + run facts, in the hero margin.
- **Buttons:** sharp, hairline border, transparent → invert on hover; focus ring.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-17 | Initial system (v1): GitHub-native dark, Geist + cyan | First pass from /design-consultation. |
| 2026-06-17 | Superseded by "Instrument / Redaction" (final) | User feedback: v1 "looks like an AI agent made it." Rebuilt via /ui-ux-pro-max into a committed all-mono terminal-instrument system: JetBrains Mono only, warm bone ink, red signature, film grain, redaction concept, registration marks, live ticker, gauge, sparklines. All motion GPU-composited for 60fps. Canonical: preview-final.html. |

---

### Add to the InjectGuard repo's CLAUDE.md
```markdown
## Design System
Read DESIGN.md before any UI work. System: JetBrains Mono only, warm bone ink (#E9E4D8) on near-black (#08090B), red (#FF453A) as signature, green (#35C26B) = blocked. Brutalist "Instrument / Redaction" aesthetic; sharp corners; hairline rules; film grain. Attack-outcome states use icon + text, never color alone. All animation is transform/opacity only (60fps) and honors prefers-reduced-motion. Canonical reference: preview-final.html. Do not deviate without explicit approval.
```
