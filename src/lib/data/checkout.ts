"use server";

import {
  getCheckout,
  updateAddresses,
  advance,
  next,
  getShipments as _getShipments,
  selectShippingRate as _selectShippingRate,
  applyCoupon,
  removeCoupon,
  complete,
} from "@spree/next";
import type { AddressParams } from "./addresses";

export async function getCheckoutOrder(orderId: string) {
  try {
    return await getCheckout(orderId);
  } catch {
    return null;
  }
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
  try {
    const order = await updateAddresses(orderId, addresses);
    return { success: true, order };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update addresses",
    };
  }
}

export async function advanceCheckout(orderId: string) {
  try {
    const order = await advance(orderId);
    return { success: true, order };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to advance checkout",
    };
  }
}

export async function getShipments(orderId: string) {
  try {
    const response = await _getShipments(orderId);
    return response.data;
  } catch {
    return [];
  }
}

export async function selectShippingRate(
  orderId: string,
  shipmentId: string,
  shippingRateId: string,
) {
  try {
    await _selectShippingRate(orderId, shipmentId, shippingRateId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to select shipping rate",
    };
  }
}

export async function applyCouponCode(orderId: string, couponCode: string) {
  try {
    const order = await applyCoupon(orderId, couponCode);
    return { success: true, order };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid coupon code",
    };
  }
}

export async function removeCouponCode(orderId: string, promotionId: string) {
  try {
    const order = await removeCoupon(orderId, promotionId);
    return { success: true, order };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove coupon code",
    };
  }
}

export async function completeOrder(orderId: string) {
  try {
    const order = await complete(orderId);
    return { success: true, order };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to complete order",
    };
  }
}
