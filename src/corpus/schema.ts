import { z } from "zod";

/** How the injection is embedded into the page the AI reads. */
export const Technique = z.enum([
  "hidden-text", // white-on-white / display:none CSS
  "html-comment", // <!-- ... -->
  "markdown", // e.g. malicious image alt-text
  "unicode-smuggling", // zero-width / Unicode-tag chars
  "instruction-in-data", // a malicious instruction sitting in a data field
]);

/** What the attacker is trying to make the model do. */
export const Goal = z.enum(["instruction-override", "canary-exfiltration", "link-injection"]);

export const AttackPayloadSchema = z.object({
  id: z.string().min(1),
  technique: Technique,
  goal: Goal,
  /** The plain malicious instruction. The technique decides how it is embedded. */
  injection: z.string().min(1),
  description: z.string().optional(),
  source: z.string().optional(),
});

export type AttackPayload = z.infer<typeof AttackPayloadSchema>;

export const CorpusSchema = z.array(AttackPayloadSchema);
