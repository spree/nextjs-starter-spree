"use server"

import { SpreeError } from "@/lib/spree"
import { getAuthHeadersWithRefresh, refreshAuthToken, removeAuthToken } from "./cookies"

export type AuthHeaders = { token?: string }

/**
 * Execute an authenticated request with automatic token refresh on 401
 * @param fn - Function that takes auth headers and returns a promise
 * @returns The result of the function or throws if auth fails
 */
export async function withAuthRefresh<T>(
  fn: (headers: AuthHeaders) => Promise<T>
): Promise<T> {
  const authHeaders = await getAuthHeadersWithRefresh()

  if (!authHeaders.token) {
    throw new Error("Not authenticated")
  }

  try {
    return await fn(authHeaders)
  } catch (error) {
    // If 401, try refreshing the token once
    if (error instanceof SpreeError && error.status === 401) {
      const refreshedHeaders = await refreshAuthToken()
      if (refreshedHeaders.token) {
        try {
          return await fn(refreshedHeaders)
        } catch (retryError) {
          // Refresh didn't help
          await removeAuthToken()
          throw retryError
        }
      }
      // No token after refresh - session expired
      await removeAuthToken()
      throw new Error("Session expired. Please login again.")
    }
    throw error
  }
}

/**
 * Get auth headers with refresh, returning null if not authenticated
 * Use this for optional auth (e.g., fetching data that works for both guests and users)
 */
export async function getOptionalAuthHeaders(): Promise<AuthHeaders> {
  try {
    return await getAuthHeadersWithRefresh()
  } catch {
    return {}
  }
}
