"use server";

import {
  getFulfillments as _getFulfillments,
  selectDeliveryRate as _selectDeliveryRate,
  applyCoupon,
  getCart,
  getOrder,
  removeCoupon,
  updateCart,
} from "@spree/next";
import type { AddressParams, Cart } from "@spree/sdk";
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
    ship_address?: AddressParams;
    bill_address?: AddressParams;
    ship_address_id?: string;
    bill_address_id?: string;
    email?: string;
  },
) {
  return actionResult(async () => {
    const cart = await updateCart(addresses);
    return { cart };
  }, "Failed to update addresses");
}

export async function updateOrderMarket(
  cartId: string,
  params: { currency: string; locale: string },
) {
  return actionResult(async () => {
    const cart = await updateCart(params);
    return { cart };
  }, "Failed to update order market");
}

export async function getFulfillments(cartId: string) {
  return withFallback(async () => {
    const response = await _getFulfillments();
    return response.data;
  }, []);
}

export async function selectDeliveryRate(
  cartId: string,
  fulfillmentId: string,
  deliveryRateId: string,
) {
  return actionResult(async () => {
    const cart = await _selectDeliveryRate(fulfillmentId, deliveryRateId);
    return { cart };
  }, "Failed to select delivery rate");
}

export async function applyCouponCode(cartId: string, couponCode: string) {
  return actionResult(async () => {
    const cart = await applyCoupon(couponCode);
    return { cart };
  }, "Failed to apply coupon code");
}

export async function removeCouponCode(cartId: string, couponCode: string) {
  return actionResult(async () => {
    const cart = await removeCoupon(couponCode);
    return { cart };
  }, "Failed to remove coupon code");
}
