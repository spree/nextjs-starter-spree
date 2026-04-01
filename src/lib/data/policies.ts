"use server";

import type { Policy } from "@spree/sdk";
import { getClient } from "@/lib/spree";

export async function getPolicy(slug: string): Promise<Policy | null> {
  const client = getClient();
  return client.policies.get(slug).catch(() => null);
}
