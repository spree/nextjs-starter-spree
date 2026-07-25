"use server";

import { type Policy, SpreeError } from "@spree/sdk";
import { cacheLife, cacheTag } from "next/cache";
import { getClient, getLocaleOptions } from "@/lib/spree";

export async function cachedGetPolicy(
  slugOrId: string,
  options: { locale?: string; country?: string },
): Promise<Policy | null> {
  "use cache: remote";
  cacheLife("tenMinutes");
  cacheTag("policies", `policy:${slugOrId}`);
  try {
    return await getClient().policies.get(slugOrId, options);
  } catch (error) {
    if (error instanceof SpreeError && error.status === 404) return null;
    throw error;
  }
}

export async function getPolicy(
  slugOrId: string,
  options?: { locale?: string; country?: string },
): Promise<Policy | null> {
  return cachedGetPolicy(slugOrId, options ?? (await getLocaleOptions()));
}
