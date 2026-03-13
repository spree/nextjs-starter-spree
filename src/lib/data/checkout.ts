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

export async function getCheckoutOrder(orderId: string): Promise<Cart | null> {
  // Try active cart first (order may still be completing)
  const cart = await getCart();
  if (cart) return cart;

  // Cart completed — fetch as completed order (works for both guests and authenticated users).
  // Cast to Cart since the order-placed page uses shared fields (items, totals, addresses).
  return withFallback(
    async () => (await getOrder(orderId)) as unknown as Cart,
    null,
  );
}

export async function updateOrderAddresses(
  _orderId: string,
  addresses: {
    ship_address?: AddressParams;
    bill_address?: AddressParams;
    ship_address_id?: string;
    bill_address_id?: string;
    email?: string;
  },
) {
  return actionResult(async () => {
    const order = await updateCart(addresses);
    return { order };
  }, "Failed to update addresses");
}

export async function updateOrderMarket(
  _orderId: string,
  params: { currency: string; locale: string },
) {
  return actionResult(async () => {
    const order = await updateCart(params);
    return { order };
  }, "Failed to update order market");
}

export async function getShipments(_orderId: string) {
  return withFallback(async () => {
    const response = await _getShipments();
    return response.data;
  }, []);
}

export async function selectShippingRate(
  _orderId: string,
  shipmentId: string,
  shippingRateId: string,
) {
  return actionResult(async () => {
    const order = await _selectShippingRate(shipmentId, shippingRateId);
    return { order };
  }, "Failed to select shipping rate");
}

export async function applyCouponCode(_orderId: string, couponCode: string) {
  return actionResult(async () => {
    const order = await applyCoupon(couponCode);
    return { order };
  }, "Failed to apply coupon code");
}

export async function removeCouponCode(_orderId: string, couponCode: string) {
  return actionResult(async () => {
    const order = await removeCoupon(couponCode);
    return { order };
  }, "Failed to remove coupon code");
}

export async function completeOrder(_orderId: string) {
  return actionResult(async () => {
    const order = await complete();
    return { order };
  }, "Failed to complete order");
}
