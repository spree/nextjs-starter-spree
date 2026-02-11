"use server";

import {
  deleteCreditCard as _deleteCreditCard,
  listCreditCards,
} from "@spree/next";
import type { StoreCreditCard } from "@spree/sdk";

export async function getCreditCards(): Promise<{ data: StoreCreditCard[] }> {
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
