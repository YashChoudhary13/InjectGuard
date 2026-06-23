import { CorpusSchema, type AttackPayload } from "./schema";
import attacks from "./attacks.json";

/** Validate raw data against the schema and reject duplicate ids. Throws on invalid input. */
export function parseCorpus(raw: unknown): AttackPayload[] {
  const arr = CorpusSchema.parse(raw);
  const seen = new Set<string>();
  for (const p of arr) {
    if (seen.has(p.id)) throw new Error(`duplicate attack id: ${p.id}`);
    seen.add(p.id);
  }
  return arr;
}

/** Load and validate the bundled seed attack corpus. */
export function loadCorpus(): AttackPayload[] {
  return parseCorpus(attacks);
}
