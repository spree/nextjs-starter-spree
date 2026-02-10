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
  return _clearCart();
}

export async function addToCart(variantId: string, quantity: number) {
  await addItem(variantId, quantity);
  return _getCart();
}

export async function updateCartItem(lineItemId: string, quantity: number) {
  await updateItem(lineItemId, quantity);
  return _getCart();
}

export async function removeCartItem(lineItemId: string) {
  await removeItem(lineItemId);
  return _getCart();
}

export async function associateCartWithUser() {
  try {
    await associateCart();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to associate cart",
    };
  }
}
