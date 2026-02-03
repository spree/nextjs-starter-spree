"use server";

import { cookies } from "next/headers";
import { getSpreeClient } from "@/lib/spree";

const AUTH_TOKEN_KEY = "_spree_jwt";
const AUTH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function setAuthToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_TOKEN_KEY, token, {
    maxAge: AUTH_TOKEN_MAX_AGE,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_TOKEN_KEY)?.value;
}

export async function removeAuthToken() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_TOKEN_KEY, "", {
    maxAge: -1,
    path: "/",
  });
}

export async function getAuthHeaders(): Promise<{ token?: string }> {
  const token = await getAuthToken();
  if (!token) {
    return {};
  }
  return { token };
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return !!token;
}

/**
 * Refresh the auth token and return new headers
 * Returns empty headers if refresh fails (user will need to login again)
 */
export async function refreshAuthToken(): Promise<{ token?: string }> {
  const currentToken = await getAuthToken();
  if (!currentToken) {
    return {};
  }

  try {
    const client = getSpreeClient();
    const response = await client.auth.refresh({ token: currentToken });
    await setAuthToken(response.token);
    return { token: response.token };
  } catch {
    // Refresh failed - token is invalid, remove it
    await removeAuthToken();
    return {};
  }
}

/**
 * Get auth headers, refreshing token if needed
 * This should be used for authenticated API calls
 */
export async function getAuthHeadersWithRefresh(): Promise<{ token?: string }> {
  const token = await getAuthToken();
  if (!token) {
    return {};
  }

  // Check if token is close to expiry by decoding JWT
  // JWT format: header.payload.signature
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp;
    const now = Math.floor(Date.now() / 1000);

    // Refresh if token expires in less than 1 hour
    if (exp && exp - now < 3600) {
      return await refreshAuthToken();
    }
  } catch {
    // If we can't decode the token, try to use it anyway
    // The server will reject it if invalid
  }

  return { token };
}
