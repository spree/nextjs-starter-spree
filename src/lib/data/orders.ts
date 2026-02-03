"use server";

import { getSpreeClient } from "@/lib/spree";
import { withAuthRefresh } from "./auth-request";
import { getAuthHeadersWithRefresh } from "./cookies";

interface OrderListParams {
  page?: number;
  per_page?: number;
  includes?: string;
}

export async function getOrders(params?: OrderListParams) {
  const authHeaders = await getAuthHeadersWithRefresh();

  if (!authHeaders.token) {
    return { data: [], meta: { page: 1, limit: 25, count: 0, pages: 0 } };
  }

  try {
    return await withAuthRefresh(async (headers) => {
      const client = getSpreeClient();
      return await client.orders.list(params, headers);
    });
  } catch {
    return { data: [], meta: { page: 1, limit: 25, count: 0, pages: 0 } };
  }
}

export async function getOrder(id: string, params?: { includes?: string }) {
  const authHeaders = await getAuthHeadersWithRefresh();

  if (!authHeaders.token) {
    return null;
  }

  try {
    return await withAuthRefresh(async (headers) => {
      const client = getSpreeClient();
      return await client.orders.get(id, params, headers);
    });
  } catch {
    return null;
  }
}
