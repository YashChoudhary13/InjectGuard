import { describe, it, expect } from "vitest";
import { buildPoisonedContent } from "./poison";
import { sanitize } from "../defense/sanitize";
import { loadCorpus } from "../corpus/loader";

/**
 * Round-trip: build a poisoned page from every real corpus payload, then prove the
 * defense neutralizes it. Two defense modes by technique:
 *   - STRIPPED: content the user can't see is removed outright by sanitize().
 *   - TAGGED:   visible-looking content survives, but is wrapped as untrusted data.
 * Every payload also has to carry a *real* attack before defense (realism check).
 */

const CLEAN = "How to brew a better cup of coffee at home.";

const STRIPPED: ReadonlySet<string> = new Set([
  "hidden-text",
  "html-comment",
  "unicode-smuggling",
]);

const corpus = loadCorpus();

describe("poison → defense round-trip (real corpus)", () => {
  it("the corpus exercises both stripped and tagged techniques", () => {
    const techniques = new Set(corpus.map((p) => p.technique));
    expect([...techniques].some((t) => STRIPPED.has(t))).toBe(true);
    expect([...techniques].some((t) => !STRIPPED.has(t))).toBe(true);
  });

  for (const p of corpus) {
    describe(`${p.id} (${p.technique})`, () => {
      const poisoned = buildPoisonedContent(CLEAN, p);
      const defended = sanitize(poisoned);

      it("carries a real attack before the defense runs", () => {
        if (p.technique === "unicode-smuggling") {
          expect(poisoned).not.toContain(p.injection); // smuggled, not literal
          expect(poisoned).toMatch(/[\u{E0000}-\u{E007F}]/u);
        } else {
          expect(poisoned).toContain(p.injection);
        }
      });

      it("keeps the clean page and wraps output as untrusted with no breakout", () => {
        expect(defended).toContain(CLEAN);
        expect(defended.startsWith("<untrusted>")).toBe(true);
        expect(defended.trimEnd().endsWith("</untrusted>")).toBe(true);
        expect((defended.match(/<\/untrusted>/gi) || []).length).toBe(1);
      });

      it(
        STRIPPED.has(p.technique)
          ? "removes the injection (hidden content stripped)"
          : "neutralizes the injection by tagging it as untrusted data",
        () => {
          if (STRIPPED.has(p.technique)) {
            expect(defended).not.toContain(p.injection);
          } else {
            // visible-looking payload survives, but only inside the untrusted wrapper
            expect(defended).toContain(p.injection);
            const inner = defended.slice("<untrusted>".length);
            expect(inner).toContain(p.injection);
          }
        },
      );
    });
  }
});
