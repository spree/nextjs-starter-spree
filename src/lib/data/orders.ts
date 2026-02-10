"use server";

import {
  listOrders as _listOrders,
  getOrder as _getOrder,
} from "@spree/next";

export async function getOrders(params?: Record<string, unknown>) {
  try {
    return await _listOrders(params);
  } catch {
    return { data: [] };
  }
}

export async function getOrder(id: string, params?: Record<string, unknown>) {
  try {
    return await _getOrder(id, params);
  } catch {
    return null;
  }
}
