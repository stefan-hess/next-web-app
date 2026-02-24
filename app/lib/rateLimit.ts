// In-memory sliding-window rate limiter.
// Note: state is per-process. For multi-instance deployments (e.g. Vercel
// serverless) replace this with @upstash/ratelimit + @upstash/redis so limits
// are enforced across all instances.

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  ip: string,
  options: { limit: number; windowMs: number }
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= options.limit) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}
