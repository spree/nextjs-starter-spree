"use server"

import { getSpreeClient } from "@/lib/spree"
import { getAuthHeadersWithRefresh } from "./cookies"
import { withAuthRefresh } from "./auth-request"
import { updateTag } from "next/cache"

export async function getCreditCards() {
  const authHeaders = await getAuthHeadersWithRefresh()

  if (!authHeaders.token) {
    return { data: [], meta: { page: 1, limit: 25, count: 0, pages: 0 } }
  }

  try {
    return await withAuthRefresh(async (headers) => {
      const client = getSpreeClient()
      return await client.customer.creditCards.list(undefined, headers)
    })
  } catch {
    return { data: [], meta: { page: 1, limit: 25, count: 0, pages: 0 } }
  }
}

export async function deleteCreditCard(id: string) {
  try {
    await withAuthRefresh(async (headers) => {
      const client = getSpreeClient()
      return await client.customer.creditCards.delete(id, headers)
    })
    updateTag("credit-cards")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete credit card"
    }
  }
}
