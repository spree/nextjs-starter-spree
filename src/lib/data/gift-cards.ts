"use server";

import {
  listGiftCards as _listGiftCards,
  getGiftCard as _getGiftCard,
} from "@spree/next";

export async function getGiftCards() {
  try {
    return await _listGiftCards();
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
