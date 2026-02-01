"use server"

import { getSpreeClient } from "@/lib/spree"
import { getAuthHeaders } from "./cookies"

interface OrderListParams {
  page?: number
  per_page?: number
  includes?: string
}

export async function getOrders(params?: OrderListParams) {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders.token) {
    return { data: [], meta: { page: 1, limit: 25, count: 0, pages: 0 } }
  }

  try {
    const client = getSpreeClient()
    return await client.orders.list(params, authHeaders)
  } catch {
    return { data: [], meta: { page: 1, limit: 25, count: 0, pages: 0 } }
  }
}

export async function getOrder(id: string, params?: { includes?: string }) {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders.token) {
    return null
  }

  try {
    const client = getSpreeClient()
    return await client.orders.get(id, params, authHeaders)
  } catch {
    return null
  }
}
