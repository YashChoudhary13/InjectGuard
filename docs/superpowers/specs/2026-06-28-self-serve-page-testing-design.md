# Self-Serve Page Testing Design

## Goal
Make InjectGuard useful to visitors by letting them paste their own website HTML or text into the playground and run the existing indirect prompt-injection test flow against it.

## Scope
- Add a playground source switch: curated demo page or custom pasted page.
- Let users provide a custom page title and HTML/text body.
- Keep model selection restricted to the existing server-side model roster.
- Keep API keys server-side only. Do not expose FreeLLMAPI or other user-provided model keys in the browser.
- Add a copyable/downloadable JSON report for each run.

## Non-Goals
- No server-side URL fetching in this pass. This avoids SSRF, content-size, timeout, and legal/robots issues.
- No public custom model endpoint support.
- No batch scan across every attack in one click. One run remains one model call.

## Architecture
`pages/playground.tsx` sends either `{ pageId }` or `{ customPage: { title, html } }` to `pages/api/attack.ts`. The API validates the input shape and length before calling `handleAttack`. `handleAttack` resolves a `DemoPageRef` from either the custom page or the existing demo-page dependency, then uses the current `runAttack` flow unchanged.

## Validation Rules
- `customPage.title`: optional from the UI but normalized server-side to `Custom page`; maximum 120 characters.
- `customPage.html`: required in custom mode after trimming; maximum 20,000 characters.
- Requests must provide exactly one page source: `pageId` or `customPage`.
- Invalid requests return `400` with a clear message.

## Report
Each successful run includes a report object with timestamp, page title, attack id, technique, goal, model id, defense state, verdict, judge method, and reason. The UI renders it as JSON and provides Copy JSON and Download JSON actions.

## Testing
- Unit tests cover custom page resolution and validation helpers.
- API/handler behavior remains dependency-injected and testable without live model calls.
- Full `npm test` and `npm run build` must pass.
