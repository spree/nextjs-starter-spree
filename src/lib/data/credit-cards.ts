"use server";

import { getClient, withAuthRefresh } from "@spree/next";
import type { CreditCard } from "@spree/sdk";
import { updateTag } from "next/cache";
import { actionResult, withFallback } from "./utils";

export async function getCreditCards(): Promise<{ data: CreditCard[] }> {
  return withFallback(
    async () => {
      return withAuthRefresh(async (options) => {
        return getClient().customer.creditCards.list(undefined, options);
      });
    },
    { data: [] } as { data: CreditCard[] },
  );
}

export async function deleteCreditCard(id: string) {
  return actionResult(async () => {
    await withAuthRefresh(async (options) => {
      return getClient().customer.creditCards.delete(id, options);
    });
    updateTag("credit-cards");
    return {};
  }, "Failed to delete credit card");
}
