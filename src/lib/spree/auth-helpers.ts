import type { RequestOptions } from "@spree/sdk";
import { SpreeError } from "@spree/sdk";
import { getClient } from "./config";
import {
  canPersistCookies,
  clearAccessToken,
  clearRefreshToken,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "./cookies";
import { isJwtExpired } from "./jwt";

export type SessionState =
  | "valid"
  | "refreshed"
  | "expired"
  | "anonymous"
  | "stale";

/**
 * Whether an error is a confirmed authentication failure (401/403) rather than a
 * transient network or server error. Only confirmed auth failures should drop
 * the session; transient failures must preserve it so a later retry can recover.
 */
export function isAuthError(error: unknown): boolean {
  return (
    error instanceof SpreeError &&
    (error.status === 401 || error.status === 403)
  );
}

/**
 * Get auth request options from the current JWT token.
 * Proactively refreshes the token using the refresh token if the JWT is close to expiry.
 */
export async function getAuthOptions(): Promise<RequestOptions> {
  const token = await getAccessToken();
  if (!token) {
    return {};
  }

  // Refresh proactively when the JWT is within 5 minutes of expiry.
  if (isJwtExpired(token, 300)) {
    const newToken = await tryRefresh();
    if (newToken) {
      return { token: newToken };
    }
  }

  return { token };
}

/**
 * Execute an authenticated request with automatic token refresh on 401.
 * @param fn - Function that takes RequestOptions and returns a promise
 * @returns The result of the function
 * @throws SpreeError if auth fails after refresh attempt
 */
export async function withAuthRefresh<T>(
  fn: (options: RequestOptions) => Promise<T>,
): Promise<T> {
  const options = await getAuthOptions();

  if (!options.token) {
    throw new SpreeError(
      { error: { code: "unauthorized", message: "Not authenticated" } },
      401,
    );
  }

  try {
    return await fn(options);
  } catch (error: unknown) {
    // If 401, try refreshing the token using the refresh token
    if (error instanceof SpreeError && error.status === 401) {
      const newToken = await tryRefresh();
      if (newToken) {
        return await fn({ token: newToken });
      }
      // tryRefresh drops the session only when the refresh token is confirmed
      // invalid; a transient failure leaves it intact so the client can retry.
      // Rethrow the original 401 either way.
      throw error;
    }
    throw error;
  }
}

/**
 * Ensure the stored session has a live JWT, refreshing it when expired.
 * Meant to be called from a Server Action (where cookies are writable) on
 * client mount. The returned state lets the caller re-render server components
 * after a transparent refresh.
 */
export async function ensureFreshSession(): Promise<SessionState> {
  const token = await getAccessToken();
  if (!token) return "anonymous";

  if (!isJwtExpired(token, 30)) return "valid";

  const newToken = await tryRefresh();
  if (newToken) return "refreshed";

  // Refresh failed. tryRefresh drops the cookies only when the refresh token is
  // confirmed invalid; if they survive, the failure was transient — report
  // `stale` so the caller preserves the session instead of logging out on a blip.
  const refreshToken = await getRefreshToken();
  return refreshToken ? "stale" : "expired";
}

// Coalesces concurrent refreshes that share the same rotated refresh token.
// The backend invalidates a refresh token once it's used, so two in-flight
// refreshes racing on the same token would leave the loser rotating a
// now-stale token and clearing the freshly persisted session. Keyed by the
// token value so distinct sessions never share a refresh.
const refreshInFlight = new Map<string, Promise<string | null>>();

/**
 * Try to refresh the access token using the stored refresh token.
 * Returns the new access token on success, null on failure.
 *
 * The backend rotates the refresh token on every use, so the rotated value
 * MUST be persisted. When the current context can't write cookies (a Server
 * Component render), the network call is skipped rather than rotating a token
 * that can't be stored — the client re-runs this from a Server Action.
 */
async function tryRefresh(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  // Don't rotate a refresh token we have no way to persist.
  if (!(await canPersistCookies())) return null;

  const existing = refreshInFlight.get(refreshToken);
  if (existing) return existing;

  const refresh = (async () => {
    try {
      const refreshed = await getClient().auth.refresh({
        refresh_token: refreshToken,
      });
      await setAccessToken(refreshed.token);
      await setRefreshToken(refreshed.refresh_token);
      return refreshed.token;
    } catch (error) {
      // Only a confirmed-invalid refresh token means the session is truly dead.
      // Transient failures (network, 5xx) must preserve the session so a later
      // retry can recover rather than logging the user out on a blip.
      if (isAuthError(error)) {
        await clearAuthCookies();
      }
      return null;
    } finally {
      refreshInFlight.delete(refreshToken);
    }
  })();

  refreshInFlight.set(refreshToken, refresh);
  return refresh;
}

export async function clearAuthCookies(): Promise<void> {
  try {
    await clearAccessToken();
    await clearRefreshToken();
  } catch {
    // Cookie clears are best-effort — not writable during a Server Component render.
  }
}
