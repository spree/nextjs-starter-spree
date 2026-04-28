"use server";

import type { Cart, CreateCartParams } from "@spree/sdk";
import { updateTag } from "next/cache";
import {
  clearCartCookies,
  getAccessToken,
  getCartId,
  getCartOptions,
  getCartToken,
  getClient,
  getLocaleOptions,
  requireCartId,
  setCartCookies,
} from "@/lib/spree";
import { actionResult } from "./utils";

/**
 * Get the current cart. Returns null if no cart exists.
 */
export async function getCart(explicitCartId?: string): Promise<Cart | null> {
  const spreeToken = await getCartToken();
  const token = await getAccessToken();
  const cartId = explicitCartId ?? (await getCartId());

  if (!cartId && !token) return null;

  try {
    if (cartId) {
      return await getClient().carts.get(cartId, { spreeToken, token });
    }

    // Authenticated user without stored cart ID — find their most recent cart
    if (token) {
      const response = await getClient().carts.list({ token });
      if (response.data.length > 0) {
        const cart = response.data[0];
        await setCartCookies(cart.id, cart.token);
        return cart;
      }
    }

    return null;
  } catch {
    // Cart not found (e.g., order was completed) — clear stale cookies.
    // Wrapped in try/catch because clearCartCookies sets cookies, which
    // is not allowed in Server Components (only in Server Actions).
    if (!explicitCartId) {
      try {
        await clearCartCookies();
      } catch {
        // Ignore — cookie clearing is best-effort
      }
    }
    return null;
  }
}

/**
 * Get existing cart or create a new one.
 */
export async function getOrCreateCart(
  params?: CreateCartParams,
): Promise<Cart> {
  const existing = await getCart();
  if (existing) return existing;

  const token = await getAccessToken();
  const localeOptions = await getLocaleOptions();
  const cartParams =
    params && Object.keys(params).length > 0 ? params : undefined;
  const cart = await getClient().carts.create(cartParams, {
    ...localeOptions,
    ...(token ? { token } : undefined),
  });

  await setCartCookies(cart.id, cart.token);

  updateTag("cart");
  return cart;
}

export async function clearCart() {
  return actionResult(async () => {
    await clearCartCookies();
    updateTag("cart");
    return {};
  }, "Failed to clear cart");
}

export async function addToCart(variantId: string, quantity: number) {
  return actionResult(async () => {
    const cart = await getOrCreateCart();
    const spreeToken = await getCartToken();
    const token = await getAccessToken();

    const updatedCart = await getClient().carts.items.create(
      cart.id,
      { variant_id: variantId, quantity },
      { spreeToken, token },
    );

    updateTag("cart");
    return { cart: updatedCart };
  }, "Failed to add item to cart");
}

export async function updateCartItem(lineItemId: string, quantity: number) {
  return actionResult(async () => {
    const options = await getCartOptions();
    const cartId = await requireCartId();

    const cart = await getClient().carts.items.update(
      cartId,
      lineItemId,
      { quantity },
      options,
    );

    updateTag("cart");
    return { cart };
  }, "Failed to update cart item");
}

export async function removeCartItem(lineItemId: string) {
  return actionResult(async () => {
    const options = await getCartOptions();
    const cartId = await requireCartId();

    const cart = await getClient().carts.items.delete(
      cartId,
      lineItemId,
      options,
    );

    updateTag("cart");
    return { cart };
  }, "Failed to remove cart item");
}

export async function associateCartWithUser() {
  return actionResult(async () => {
    const spreeToken = await getCartToken();
    const token = await getAccessToken();
    const cartId = await getCartId();
    if (!cartId || !token) return {};

    try {
      await getClient().carts.associate(cartId, { spreeToken, token });
      updateTag("cart");
    } catch {
      // Cart might already belong to another user — clear it
      await clearCartCookies();
      updateTag("cart");
    }
    return {};
  }, "Failed to associate cart");
}
