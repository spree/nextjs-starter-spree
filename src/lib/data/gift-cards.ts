"use server";

import { getGiftCard as _getGiftCard, listGiftCards } from "@spree/next";

export async function getGiftCards() {
  try {
    return await listGiftCards();
  } catch {
    return { data: [] };
  }
}

export async function getGiftCard(id: string) {
  try {
    return await _getGiftCard(id);
  } catch {
    return null;
  }
}
