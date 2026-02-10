"use server";

import {
  listCreditCards as _listCreditCards,
  deleteCreditCard as _deleteCreditCard,
} from "@spree/next";

export async function getCreditCards() {
  try {
    return await _listCreditCards();
  } catch {
    return { data: [] };
  }
}

export async function deleteCreditCard(id: string) {
  try {
    await _deleteCreditCard(id);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete credit card",
    };
  }
}
