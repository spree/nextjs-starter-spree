"use server";

import {
  clearCart as _clearCart,
  getCart as _getCart,
  getOrCreateCart as _getOrCreateCart,
  addItem,
  associateCart,
  removeItem,
  updateItem,
} from "@spree/next";

export async function getCart() {
  return _getCart();
}

export async function getOrCreateCart() {
  return _getOrCreateCart();
}

export async function clearCart() {
  try {
    await _clearCart();
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to clear cart",
    };
  }
}

export async function addToCart(variantId: string, quantity: number) {
  try {
    await addItem(variantId, quantity);
    const cart = await _getCart();
    return { success: true as const, cart };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to add item to cart",
    };
  }
}

export async function updateCartItem(lineItemId: string, quantity: number) {
  try {
    await updateItem(lineItemId, quantity);
    const cart = await _getCart();
    return { success: true as const, cart };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to update cart item",
    };
  }
}

export async function removeCartItem(lineItemId: string) {
  try {
    await removeItem(lineItemId);
    const cart = await _getCart();
    return { success: true as const, cart };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to remove cart item",
    };
  }
}

export async function associateCartWithUser() {
  try {
    await associateCart();
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to associate cart",
    };
  }
}
