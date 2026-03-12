"use server";

import { advance, updateOrder } from "@spree/next";
import type { AddressParams, StoreOrder } from "@spree/sdk";
import { actionResult } from "@/lib/data/utils";

type ActionSuccess<T extends Record<string, unknown>> =
  | ({ success: true } & T)
  | { success: false; error: string };

export interface QuickCheckoutPartialAddress {
  firstname?: string;
  lastname?: string;
  city: string;
  zipcode: string;
  country_iso: string;
  state_name?: string;
}

export async function quickCheckoutUpdateAddress(
  orderId: string,
  address: QuickCheckoutPartialAddress,
): Promise<ActionSuccess<{ order: StoreOrder }>> {
  return actionResult(async () => {
    const order = await updateOrder(orderId, {
      ship_address: {
        ...address,
        firstname: address.firstname?.trim() || "Express",
        lastname: address.lastname?.trim() || "Checkout",
        address1: "TBD",
        quick_checkout: true,
      },
    });
    return { order };
  }, "Failed to update address for quick checkout");
}

export async function quickCheckoutAdvance(
  orderId: string,
): Promise<ActionSuccess<{ order: StoreOrder }>> {
  return actionResult(async () => {
    const order = await advance(orderId);
    return { order };
  }, "Failed to advance order");
}

export async function quickCheckoutUpdateFullAddress(
  orderId: string,
  params: {
    email: string;
    shipAddress: AddressParams;
    billAddress: AddressParams;
  },
): Promise<ActionSuccess<{ order: StoreOrder }>> {
  return actionResult(async () => {
    const order = await updateOrder(orderId, {
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
    return { order };
  }, "Failed to update full address");
}

export async function quickCheckoutClearAddresses(
  orderId: string,
): Promise<ActionSuccess<{ order: StoreOrder }>> {
  return actionResult(async () => {
    const order = await updateOrder(orderId, {
      ship_address_id: "CLEAR",
      bill_address_id: "CLEAR",
    });
    return { order };
  }, "Failed to clear addresses");
}
