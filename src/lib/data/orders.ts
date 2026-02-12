"use server";

import { getOrder as _getOrder, listOrders } from "@spree/next";
import { withFallback } from "./utils";

export async function getOrders(params?: Record<string, unknown>) {
  return withFallback(() => listOrders(params), { data: [] });
}

export async function getOrder(id: string, params?: Record<string, unknown>) {
  return withFallback(() => _getOrder(id, params), null);
}
