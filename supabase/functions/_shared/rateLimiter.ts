export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfter?: number;
}

// Deno KV is not available in Supabase Edge Functions.
// Rate limiting at the application level (daily_usage table) handles abuse.
// This module keeps the interface intact for future use.
export async function checkRateLimit(
  _functionName: string,
  _ip: string,
): Promise<RateLimitResult> {
  return { allowed: true, remaining: 999, limit: 999 };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
  };
  if (result.retryAfter !== undefined) {
    headers["Retry-After"] = String(result.retryAfter);
  }
  return headers;
}
