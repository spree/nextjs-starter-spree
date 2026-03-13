"use server";

import {
  getShipments as _getShipments,
  selectShippingRate as _selectShippingRate,
  applyCoupon,
  complete,
  getCart,
  getOrder,
  removeCoupon,
  updateCart,
} from "@spree/next";
import type { AddressParams, Cart } from "@spree/sdk";
import { actionResult, withFallback } from "./utils";

export async function getCheckoutOrder(cartId: string): Promise<Cart | null> {
  // Try active cart first (order may still be completing)
  const cart = await getCart();
  if (cart && cart.id === cartId) return cart;

  // Cart completed — fetch as completed order (works for both guests and authenticated users).
  // Cast to Cart since the order-placed page uses shared fields (items, totals, addresses).
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

export async function getShipments(cartId: string) {
  return withFallback(async () => {
    const response = await _getShipments();
    return response.data;
  }, []);
}

export async function selectShippingRate(
  cartId: string,
  shipmentId: string,
  shippingRateId: string,
) {
  return actionResult(async () => {
    const cart = await _selectShippingRate(shipmentId, shippingRateId);
    return { cart };
  }, "Failed to select shipping rate");
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

export async function completeOrder(cartId: string) {
  return actionResult(async () => {
    const cart = await complete(cartId);
    return { cart };
  }, "Failed to complete order");
}
