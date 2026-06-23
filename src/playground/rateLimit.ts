export interface RateLimitStore {
  requests: Map<string, number[]>;
}

export function makeRateLimitStore(): RateLimitStore {
  return { requests: new Map() };
}

/**
 * Returns true (and records the request) when key is under the limit.
 * `nowMs` is injected so tests can control time without mocking globals.
 */
export function checkRateLimit(
  store: RateLimitStore,
  key: string,
  opts: { maxRequests: number; windowMs: number },
  nowMs: number,
): boolean {
  const times = store.requests.get(key) ?? [];
  const recent = times.filter((t) => nowMs - t < opts.windowMs);
  if (recent.length >= opts.maxRequests) {
    store.requests.set(key, recent);
    return false;
  }
  recent.push(nowMs);
  store.requests.set(key, recent);
  return true;
}
