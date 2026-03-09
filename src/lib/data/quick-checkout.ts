"use server";

import { advance, updateOrder } from "@spree/next";
import type { AddressParams } from "@spree/sdk";
import { actionResult } from "./utils";

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
) {
  return actionResult(async () => {
    const order = await updateOrder(orderId, {
      ship_address: {
        firstname: address.firstname || "Express",
        lastname: address.lastname || "Checkout",
        address1: "TBD",
        ...address,
        quick_checkout: true,
      },
    });
    return { order };
  }, "Failed to update address for quick checkout");
}

export async function quickCheckoutAdvance(orderId: string) {
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
) {
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

export async function quickCheckoutClearAddresses(orderId: string) {
  return actionResult(async () => {
    const order = await updateOrder(orderId, {
      ship_address_id: "",
      bill_address_id: "",
    });
    return { order };
  }, "Failed to clear addresses");
}
