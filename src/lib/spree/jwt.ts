/**
 * Decode a JWT's `exp` claim (seconds since epoch) without verifying the
 * signature. Returns null when the token is malformed or carries no `exp`.
 */
export function decodeJwtExp(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

/**
 * Whether a JWT is expired, or expires within `skewSeconds`. A token that
 * can't be decoded is treated as not-expired: the server stays the source of
 * truth and rejects it if genuinely invalid.
 */
export function isJwtExpired(token: string, skewSeconds = 0): boolean {
  const exp = decodeJwtExp(token);
  if (exp === null) return false;
  const now = Math.floor(Date.now() / 1000);
  return exp - now <= skewSeconds;
}
