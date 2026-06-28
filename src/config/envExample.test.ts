/**
 * Invariant: every env var referenced by MODELS in src/harness/models.ts
 * must appear in .env.example so new contributors know what keys to provide.
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { MODELS } from "../harness/models";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ENV_EXAMPLE = path.join(ROOT, ".env.example");

describe(".env.example completeness", () => {
  it("file exists", () => {
    expect(fs.existsSync(ENV_EXAMPLE)).toBe(true);
  });

  it("declares every env var referenced by MODELS", () => {
    const content = fs.readFileSync(ENV_EXAMPLE, "utf8");
    const declaredKeys = new Set(
      content
        .split("\n")
        .filter((l) => l.match(/^[A-Z_]+=/) && !l.startsWith("#"))
        .map((l) => l.split("=")[0].trim()),
    );

    const missing: string[] = [];
    for (const model of MODELS) {
      if (!declaredKeys.has(model.envVar)) {
        missing.push(`${model.id} → ${model.envVar}`);
      }
    }

    expect(missing, `Missing from .env.example: ${missing.join(", ")}`).toHaveLength(0);
  });

  it("has no blank key names", () => {
    const content = fs.readFileSync(ENV_EXAMPLE, "utf8");
    const blankKeys = content
      .split("\n")
      .filter((l) => l.match(/^=/));
    expect(blankKeys).toHaveLength(0);
  });
});
