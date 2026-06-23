import { describe, it, expect } from "vitest";
import { makeRateLimitStore, checkRateLimit } from "./rateLimit";

const OPTS = { maxRequests: 3, windowMs: 60_000 };

describe("checkRateLimit", () => {
  it("allows the first request", () => {
    const store = makeRateLimitStore();
    expect(checkRateLimit(store, "127.0.0.1", OPTS, 0)).toBe(true);
  });

  it("allows requests up to the limit", () => {
    const store = makeRateLimitStore();
    expect(checkRateLimit(store, "ip1", OPTS, 0)).toBe(true);
    expect(checkRateLimit(store, "ip1", OPTS, 1_000)).toBe(true);
    expect(checkRateLimit(store, "ip1", OPTS, 2_000)).toBe(true);
  });

  it("rejects the request that exceeds the limit", () => {
    const store = makeRateLimitStore();
    checkRateLimit(store, "ip1", OPTS, 0);
    checkRateLimit(store, "ip1", OPTS, 1_000);
    checkRateLimit(store, "ip1", OPTS, 2_000);
    expect(checkRateLimit(store, "ip1", OPTS, 3_000)).toBe(false);
  });

  it("still rejects repeated over-limit calls", () => {
    const store = makeRateLimitStore();
    checkRateLimit(store, "ip1", OPTS, 0);
    checkRateLimit(store, "ip1", OPTS, 1_000);
    checkRateLimit(store, "ip1", OPTS, 2_000);
    expect(checkRateLimit(store, "ip1", OPTS, 3_000)).toBe(false);
    expect(checkRateLimit(store, "ip1", OPTS, 4_000)).toBe(false);
  });

  it("resets after the window expires", () => {
    const store = makeRateLimitStore();
    checkRateLimit(store, "ip1", OPTS, 0);
    checkRateLimit(store, "ip1", OPTS, 1_000);
    checkRateLimit(store, "ip1", OPTS, 2_000);
    // All three timestamps are now outside the 60s window
    expect(checkRateLimit(store, "ip1", OPTS, 62_000)).toBe(true);
  });

  it("allows more requests once old ones fall out of window", () => {
    const store = makeRateLimitStore();
    checkRateLimit(store, "ip1", OPTS, 0);
    checkRateLimit(store, "ip1", OPTS, 1_000);
    checkRateLimit(store, "ip1", OPTS, 2_000);
    // At t=61s, the t=0 request is outside the window; slot opens
    expect(checkRateLimit(store, "ip1", OPTS, 61_001)).toBe(true);
  });

  it("tracks different keys independently", () => {
    const store = makeRateLimitStore();
    checkRateLimit(store, "ip1", OPTS, 0);
    checkRateLimit(store, "ip1", OPTS, 1_000);
    checkRateLimit(store, "ip1", OPTS, 2_000);
    expect(checkRateLimit(store, "ip1", OPTS, 3_000)).toBe(false);
    expect(checkRateLimit(store, "ip2", OPTS, 3_000)).toBe(true);
  });
});
