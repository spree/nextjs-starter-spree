"use server";

import { getCartOptions, getClient, requireCartId } from "@spree/next";
import type { AddressParams, Cart } from "@spree/sdk";
import { SpreeError } from "@spree/sdk";
import { updateTag } from "next/cache";
import { getCart } from "./cart";
import { getOrder } from "./orders";
import { actionResult, withFallback } from "./utils";

export async function getCheckoutOrder(cartId: string): Promise<Cart | null> {
  // Try active cart first (order may still be in checkout)
  const cart = await getCart();
  if (cart && cart.id === cartId) return cart;

  // Cart completed — fetch as completed order.
  return withFallback(
    async () => (await getOrder(cartId)) as unknown as Cart,
    null,
  );
}

export async function getCompletedOrder(cartId: string): Promise<Cart | null> {
  // Fetch order directly — used by the order-placed page.
  // Does not call getCart() first because getCart() auto-clears
  // the cart token cookie on failure, which breaks getOrder()
  // for guest users.
  return withFallback(
    async () => (await getOrder(cartId)) as unknown as Cart,
    null,
  );
}

export async function updateOrderAddresses(
  cartId: string,
  addresses: {
    shipping_address?: AddressParams;
    billing_address?: AddressParams;
    shipping_address_id?: string;
    billing_address_id?: string;
    use_shipping?: boolean;
    email?: string;
  },
) {
  return actionResult(async () => {
    const options = await getCartOptions();
    const id = await requireCartId();
    const cart = await getClient().carts.update(id, addresses, options);
    updateTag("checkout");
    return { cart };
  }, "Failed to update addresses");
}

export async function updateOrderMarket(
  cartId: string,
  params: { currency: string; locale: string },
) {
  return actionResult(async () => {
    const options = await getCartOptions();
    const id = await requireCartId();
    const cart = await getClient().carts.update(id, params, options);
    updateTag("checkout");
    return { cart };
  }, "Failed to update order market");
}

export async function selectDeliveryRate(
  cartId: string,
  fulfillmentId: string,
  deliveryRateId: string,
) {
  return actionResult(async () => {
    const options = await getCartOptions();
    const id = await requireCartId();
    const cart = await getClient().carts.fulfillments.update(
      id,
      fulfillmentId,
      { selected_delivery_rate_id: deliveryRateId },
      options,
    );
    updateTag("checkout");
    return { cart };
  }, "Failed to select delivery rate");
}

/**
 * Apply a code to the cart — tries discount code first, then gift card.
 * Single input field on checkout, backend determines the type.
 */
export async function applyCode(cartId: string, code: string) {
  const options = await getCartOptions();
  const id = await requireCartId();

  // Try discount code first (more common)
  try {
    const cart = await getClient().carts.discountCodes.apply(id, code, options);
    updateTag("checkout");
    updateTag("cart");
    return { success: true, cart, type: "discount" as const };
  } catch (discountError) {
    // Only fall back to gift card if the discount code was not found (422/404).
    // Network errors, 500s, etc. should surface the backend message directly.
    const isNotFound =
      discountError instanceof SpreeError &&
      (discountError.status === 422 || discountError.status === 404);

    if (!isNotFound) {
      return { success: false, error: errorMessage(discountError) } as const;
    }

    // Discount code not found — try gift card
    try {
      const cart = await getClient().carts.giftCards.apply(id, code, options);
      updateTag("checkout");
      updateTag("cart");
      return { success: true, cart, type: "gift_card" as const };
    } catch (giftCardError) {
      // Gift card also failed. If it's a specific error (expired, redeemed, etc.)
      // show the backend message. If both are just "not found", show the
      // discount error (the more common scenario).
      const isGiftCardNotFound =
        giftCardError instanceof SpreeError &&
        (giftCardError.code === "gift_card_not_found" ||
          giftCardError.code === "record_not_found");

      return {
        success: false,
        error: isGiftCardNotFound
          ? errorMessage(discountError)
          : errorMessage(giftCardError),
      } as const;
    }
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "The entered code is not valid";
}

export async function removeDiscountCode(cartId: string, code: string) {
  return actionResult(async () => {
    const options = await getCartOptions();
    const id = await requireCartId();
    const cart = await getClient().carts.discountCodes.remove(
      id,
      code,
      options,
    );
    updateTag("checkout");
    updateTag("cart");
    return { cart };
  }, "Failed to remove discount code");
}

export async function removeGiftCard(cartId: string, giftCardId: string) {
  return actionResult(async () => {
    const options = await getCartOptions();
    const id = await requireCartId();
    const cart = await getClient().carts.giftCards.remove(
      id,
      giftCardId,
      options,
    );
    updateTag("checkout");
    updateTag("cart");
    return { cart };
  }, "Failed to remove gift card");
}
