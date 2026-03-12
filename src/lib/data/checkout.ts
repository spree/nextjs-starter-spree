"use server";

import {
  getShipments as _getShipments,
  selectShippingRate as _selectShippingRate,
  applyCoupon,
  complete,
  getCheckout,
  removeCoupon,
  updateCheckout,
} from "@spree/next";
import type { AddressParams } from "@spree/sdk";
import { cookies } from "next/headers";
import { CART_TOKEN_KEY } from "@/lib/constants";
import { actionResult, withFallback } from "./utils";

/**
 * Clear the cart cookie without triggering revalidation.
 * Used on the order-placed page to prevent the storefront from showing
 * the completed order, without causing a re-render that would lose the order data.
 */
export async function clearCartCookie() {
  const cookieStore = await cookies();
  cookieStore.set(CART_TOKEN_KEY, "", { maxAge: -1, path: "/" });
}

export async function getCheckoutOrder(_orderId: string) {
  return withFallback(() => getCheckout(), null);
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
    const order = await updateCheckout(addresses);
    return { order };
  }, "Failed to update addresses");
}

export async function updateOrderMarket(
  _orderId: string,
  params: { currency: string; locale: string },
) {
  return actionResult(async () => {
    const order = await updateCheckout(params);
    return { order };
  }, "Failed to update order market");
}

export async function nextCheckoutStep(_orderId: string) {
  // v3 API auto-advances on update; reload cart to get updated step
  return actionResult(async () => {
    const order = await getCheckout();
    return { order };
  }, "Failed to advance checkout");
}

export async function advanceCheckout(_orderId: string) {
  return actionResult(async () => {
    const order = await getCheckout();
    return { order };
  }, "Failed to advance checkout");
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

export async function removeCouponCode(_orderId: string, promotionId: string) {
  return actionResult(async () => {
    const order = await removeCoupon(promotionId);
    return { order };
  }, "Failed to remove coupon code");
}

export async function completeOrder(_orderId: string) {
  return actionResult(async () => {
    const order = await complete();
    return { order };
  }, "Failed to complete order");
}
