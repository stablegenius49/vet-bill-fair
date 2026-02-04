type RateState = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const bucket = new Map<string, RateState>();

export function checkRateLimit(key: string) {
  const now = Date.now();
  const existing = bucket.get(key);

  if (!existing || existing.resetAt <= now) {
    bucket.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_PER_WINDOW - 1 };
  }

  if (existing.count >= MAX_PER_WINDOW) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: MAX_PER_WINDOW - existing.count };
}
