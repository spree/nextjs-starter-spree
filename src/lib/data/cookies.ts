"use server"

import { cookies } from "next/headers"

const AUTH_TOKEN_KEY = "_spree_jwt"
const AUTH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function setAuthToken(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_TOKEN_KEY, token, {
    maxAge: AUTH_TOKEN_MAX_AGE,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(AUTH_TOKEN_KEY)?.value
}

export async function removeAuthToken() {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_TOKEN_KEY, "", {
    maxAge: -1,
    path: "/",
  })
}

export async function getAuthHeaders(): Promise<{ token?: string }> {
  const token = await getAuthToken()
  if (!token) {
    return {}
  }
  return { token }
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken()
  return !!token
}
