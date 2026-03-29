"use server";

import { getAccessToken } from "@spree/next";

export async function isAuthenticated(): Promise<boolean> {
  return !!(await getAccessToken());
}
