"use server";

import type { OrderListParams } from "@spree/sdk";
import {
  DEFAULT_SURFACE,
  getCartOptions,
  getClient,
  getClientForSurface,
  type Surface,
  withAuthRefresh,
} from "@/lib/spree";
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
 * The surface selects the cart token cookie + client so wholesale orders
 * resolve through the wholesale channel.
 */
export async function getOrder(
  id: string,
  params?: Record<string, unknown>,
  surface: Surface = DEFAULT_SURFACE,
) {
  return withFallback(async () => {
    const options = await getCartOptions(surface);
    return getClientForSurface(surface).orders.get(id, params, options);
  }, null);
}
