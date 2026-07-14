"use server";

import { getAccessToken, isJwtExpired } from "@/lib/spree";

/**
 * Whether the current request has a live customer session. A JWT cookie can
 * outlive the token it holds (7-day cookie vs 1-hour JWT), so presence alone
 * is not enough — an expired token reads as unauthenticated so the UI treats
 * the session as logged out rather than showing an authenticated-looking shell
 * over failing API calls.
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return !!token && !isJwtExpired(token, 30);
}
