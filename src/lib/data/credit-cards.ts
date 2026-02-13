"use server";

import {
  deleteCreditCard as _deleteCreditCard,
  listCreditCards,
} from "@spree/next";
import type { StoreCreditCard } from "@spree/sdk";
import { actionResult, withFallback } from "./utils";

export async function getCreditCards(): Promise<{ data: StoreCreditCard[] }> {
  return withFallback(() => listCreditCards(), { data: [] });
}

export async function deleteCreditCard(id: string) {
  return actionResult(async () => {
    await _deleteCreditCard(id);
    return {};
  }, "Failed to delete credit card");
}
