/**
 * Poisoned-content builder — the offensive half of the harness.
 *
 * Takes a clean page and one attack payload, and embeds the payload's plain
 * `injection` into the page using the technique the payload names. The result is
 * what a victim model reads with the defense OFF; running it through `sanitize()`
 * (defense ON) is what the round-trip tests verify.
 *
 * Pure and deterministic — no API calls, no randomness.
 */

import type { AttackPayload } from "../corpus/schema";

/** Map each character into the invisible Unicode Tags block (U+E0000–U+E007F). */
function smuggleInTags(s: string): string {
  return Array.from(s)
    .map((ch) => String.fromCodePoint(0xe0000 + (ch.codePointAt(0) as number)))
    .join("");
}

/**
 * Embed `payload.injection` into `cleanPage` using `payload.technique`.
 *
 * `canary` is accepted so the harness can thread the run's canary through a single
 * call site; the embedding itself never plants the secret (the attacker doesn't
 * know it — the canary lives in the victim's system prompt, see `plantCanary`).
 */
export function buildPoisonedContent(
  cleanPage: string,
  payload: AttackPayload,
  _canary?: string,
): string {
  const inj = payload.injection;
  switch (payload.technique) {
    case "hidden-text":
      return `${cleanPage}<span style="display:none">${inj}</span>`;
    case "html-comment":
      return `${cleanPage}<!-- ${inj} -->`;
    case "markdown":
      return `${cleanPage}\n\n![${inj}](https://example.com/image.png)`;
    case "unicode-smuggling":
      return `${cleanPage}${smuggleInTags(inj)}`;
    case "instruction-in-data":
      return `${cleanPage}\n\n[user_comment]: ${inj}`;
  }
}
