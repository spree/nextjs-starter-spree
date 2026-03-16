"use server";

import type { AddressParams, Cart } from "@spree/sdk";
import { selectShippingRate, updateOrderAddresses } from "@/lib/data/checkout";
import {
  completeCheckoutOrder,
  completeCheckoutPaymentSession,
  createCheckoutPaymentSession,
} from "@/lib/data/payment";
import { actionResult } from "@/lib/data/utils";

export interface ExpressCheckoutPartialAddress {
  city: string;
  zipcode: string;
  country_iso: string;
  state_name?: string;
}

export async function expressCheckoutResolveShipping(
  cartId: string,
  address: ExpressCheckoutPartialAddress,
) {
  return actionResult(async () => {
    const result = await updateOrderAddresses(cartId, {
      ship_address: {
        ...address,
        firstname: "Express",
        lastname: "Checkout",
        address1: "TBD",
        quick_checkout: true,
      },
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    return { cart: result.cart };
  }, "Failed to resolve shipping");
}

export async function expressCheckoutSelectRates(
  cartId: string,
  selections: Array<{ shipmentId: string; rateId: string }>,
) {
  return actionResult(async () => {
    let cart: Cart | null = null;

    for (const { shipmentId, rateId } of selections) {
      const result = await selectShippingRate(cartId, shipmentId, rateId);
      if (!result.success) {
        throw new Error(result.error);
      }
      cart = result.cart;
    }

    if (!cart) {
      throw new Error("No shipment selections provided");
    }

    return { cart };
  }, "Failed to select shipping rates");
}

export async function expressCheckoutPreparePayment(
  cartId: string,
  params: {
    email: string;
    shipAddress: AddressParams;
    billAddress: AddressParams;
  },
) {
  return actionResult(async () => {
    const result = await updateOrderAddresses(cartId, {
      email: params.email,
      ship_address: {
        ...params.shipAddress,
        quick_checkout: true,
      },
      bill_address: {
        ...params.billAddress,
        quick_checkout: true,
      },
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    return { cart: result.cart };
  }, "Failed to prepare payment");
}

export async function expressCheckoutCreateSession(
  cartId: string,
  paymentMethodId: string,
  stripePaymentMethodId: string,
) {
  return createCheckoutPaymentSession(
    cartId,
    paymentMethodId,
    stripePaymentMethodId,
  );
}

export async function expressCheckoutFinalize(
  cartId: string,
  sessionId: string,
) {
  return actionResult(async () => {
    const sessionResult = await completeCheckoutPaymentSession(
      cartId,
      sessionId,
    );
    if (!sessionResult.success) {
      throw new Error(sessionResult.error);
    }

    const orderResult = await completeCheckoutOrder(cartId);
    if (!orderResult.success) {
      throw new Error(orderResult.error);
    }

    return {};
  }, "Failed to finalize order");
}
