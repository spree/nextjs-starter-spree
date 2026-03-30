"use server";

import { getClient } from "@spree/next";
import type { Policy } from "@spree/sdk";

export async function getPolicy(slug: string): Promise<Policy | null> {
  const client = getClient();
  return client.policies.get(slug).catch(() => null);
}
