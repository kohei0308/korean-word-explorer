interface JwtPayload {
  exp?: number;
  iat?: number;
  iss?: string;
  sub?: string;
}

/**
 * Decodes JWT payload without verifying signature.
 * Returns null if the token is structurally invalid.
 */
function decodePayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

export interface JwtPreCheckResult {
  valid: boolean;
  reason?: "malformed" | "expired" | "wrong_issuer";
}

/**
 * Pre-validates a JWT before sending it to Supabase Auth.
 * Catches malformed tokens and expired tokens cheaply without a network call.
 * Signature verification is still delegated to Supabase's getUser().
 *
 * @param token   Raw JWT string (without "Bearer " prefix)
 * @param supabaseUrl  Expected issuer (Supabase project URL)
 */
export function preCheckJwt(token: string, supabaseUrl: string): JwtPreCheckResult {
  const payload = decodePayload(token);

  if (!payload) {
    return { valid: false, reason: "malformed" };
  }

  const nowSecs = Math.floor(Date.now() / 1000);
  if (payload.exp !== undefined && nowSecs > payload.exp) {
    return { valid: false, reason: "expired" };
  }

  // Supabase sets iss to the project URL (e.g. https://xxx.supabase.co/auth/v1)
  if (payload.iss && supabaseUrl) {
    const expectedIssuer = supabaseUrl.replace(/\/$/, "") + "/auth/v1";
    if (!payload.iss.startsWith(supabaseUrl.replace(/\/$/, ""))) {
      return { valid: false, reason: "wrong_issuer" };
    }
    void expectedIssuer; // suppress unused-var lint
  }

  return { valid: true };
}
