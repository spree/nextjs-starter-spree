"use server";

import {
  getShipments as _getShipments,
  selectShippingRate as _selectShippingRate,
  advance,
  applyCoupon,
  complete,
  getCheckout,
  removeCoupon,
  updateAddresses,
} from "@spree/next";
import type { AddressParams } from "@spree/sdk";
import { actionResult, withFallback } from "./utils";

export async function getCheckoutOrder(orderId: string) {
  return withFallback(() => getCheckout(orderId), null);
}

export async function updateOrderAddresses(
  orderId: string,
  addresses: {
    ship_address?: AddressParams;
    bill_address?: AddressParams;
    ship_address_id?: string;
    bill_address_id?: string;
    email?: string;
  },
) {
  return actionResult(async () => {
    const order = await updateAddresses(orderId, addresses);
    return { order };
  }, "Failed to update addresses");
}

export async function advanceCheckout(orderId: string) {
  return actionResult(async () => {
    const order = await advance(orderId);
    return { order };
  }, "Failed to advance checkout");
}

export async function getShipments(orderId: string) {
  return withFallback(async () => {
    const response = await _getShipments(orderId);
    return response.data;
  }, []);
}

export async function selectShippingRate(
  orderId: string,
  shipmentId: string,
  shippingRateId: string,
) {
  return actionResult(async () => {
    await _selectShippingRate(orderId, shipmentId, shippingRateId);
    return {};
  }, "Failed to select shipping rate");
}

export async function applyCouponCode(orderId: string, couponCode: string) {
  return actionResult(async () => {
    const order = await applyCoupon(orderId, couponCode);
    return { order };
  }, "Failed to apply coupon code");
}

export async function removeCouponCode(orderId: string, promotionId: string) {
  return actionResult(async () => {
    const order = await removeCoupon(orderId, promotionId);
    return { order };
  }, "Failed to remove coupon code");
}

export async function completeOrder(orderId: string) {
  return actionResult(async () => {
    const order = await complete(orderId);
    return { order };
  }, "Failed to complete order");
}
