"use server";

import { getCartOptions, getClient, withAuthRefresh } from "@spree/next";
import type { OrderListParams } from "@spree/sdk";
import { withFallback } from "./utils";

export async function getOrders(params?: OrderListParams) {
  return withFallback(
    async () => {
      return withAuthRefresh(async (options) => {
        return getClient().customer.orders.list(params, options);
      });
    },
    {
      data: [],
      meta: {
        page: 1,
        limit: 25,
        count: 0,
        pages: 0,
        from: 0,
        to: 0,
        in: 0,
        previous: null,
        next: null,
      },
    },
  );
}

/**
 * Get a single order by ID or number.
 * Works for both authenticated users (JWT) and guests (spreeToken).
 */
export async function getOrder(id: string, params?: Record<string, unknown>) {
  return withFallback(async () => {
    const options = await getCartOptions();
    return getClient().orders.get(id, params, options);
  }, null);
}
