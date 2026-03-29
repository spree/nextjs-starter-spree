"use server";

import { getClient, withAuthRefresh } from "@spree/next";
import type { GiftCard } from "@spree/sdk";
import { withFallback } from "./utils";

export async function getGiftCards() {
  return withFallback(
    async () => {
      return withAuthRefresh(async (options) => {
        return getClient().customer.giftCards.list(undefined, options);
      });
    },
    { data: [] } as { data: GiftCard[] },
  );
}

export async function getGiftCard(id: string) {
  return withFallback(async () => {
    return withAuthRefresh(async (options) => {
      return getClient().customer.giftCards.get(id, options);
    });
  }, null);
}
