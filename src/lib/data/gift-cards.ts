"use server";

import { getGiftCard as _getGiftCard, listGiftCards } from "@spree/next";
import { withFallback } from "./utils";

export async function getGiftCards() {
  return withFallback(() => listGiftCards(), { data: [] });
}

export async function getGiftCard(id: string) {
  return withFallback(() => _getGiftCard(id), null);
}
