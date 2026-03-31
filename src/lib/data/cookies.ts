"use server";

import { getAccessToken } from "@/lib/spree";

export async function isAuthenticated(): Promise<boolean> {
  return !!(await getAccessToken());
}
