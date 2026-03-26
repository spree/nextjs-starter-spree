"use server";

import {
  getPolicy as _getPolicy,
  listPolicies as _listPolicies,
} from "@spree/next";
import type { Policy } from "@spree/sdk";
import { withFallback } from "./utils";

export async function getPolicies(): Promise<Policy[]> {
  const result = await withFallback(() => _listPolicies(), { data: [] });
  return result.data;
}

export async function getPolicy(slug: string): Promise<Policy | null> {
  return withFallback(() => _getPolicy(slug), null);
}
