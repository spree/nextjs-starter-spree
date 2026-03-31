import type { RequestOptions } from "@spree/sdk";
import { SpreeError } from "@spree/sdk";
import { getClient } from "./config";
import {
  clearAccessToken,
  clearRefreshToken,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "./cookies";

/**
 * Get auth request options from the current JWT token.
 * Proactively refreshes the token using the refresh token if the JWT is close to expiry.
 */
export async function getAuthOptions(): Promise<RequestOptions> {
  const token = await getAccessToken();
  if (!token) {
    return {};
  }

  // Check if token is close to expiry by decoding JWT payload
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp;
    const now = Math.floor(Date.now() / 1000);

    // Refresh if token expires in less than 5 minutes
    if (exp && exp - now < 300) {
      const newToken = await tryRefresh();
      if (newToken) {
        return { token: newToken };
      }
    }
  } catch {
    // Can't decode JWT — use it as-is, the server will reject if invalid
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
      // Refresh failed — clear all auth cookies and rethrow
      await clearAccessToken();
      await clearRefreshToken();
      throw error;
    }
    throw error;
  }
}

/**
 * Try to refresh the access token using the stored refresh token.
 * Returns the new access token on success, null on failure.
 */
async function tryRefresh(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const refreshed = await getClient().auth.refresh({
      refresh_token: refreshToken,
    });
    await setAccessToken(refreshed.token);
    await setRefreshToken(refreshed.refresh_token);
    return refreshed.token;
  } catch {
    // Refresh token is invalid/expired — clear it
    await clearRefreshToken();
    await clearAccessToken();
    return null;
  }
}
