"use server";

import { cookies } from "next/headers";

const AUTH_TOKEN_KEY = "_spree_jwt";

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return !!cookieStore.get(AUTH_TOKEN_KEY)?.value;
}
