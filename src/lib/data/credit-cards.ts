"use server";

import {
  deleteCreditCard as _deleteCreditCard,
  listCreditCards,
} from "@spree/next";

export async function getCreditCards() {
  try {
    return await listCreditCards();
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
      error:
        error instanceof Error ? error.message : "Failed to delete credit card",
    };
  }
}
