"use server"

import { getSpreeClient } from "@/lib/spree"
import { getAuthHeadersWithRefresh } from "./cookies"
import { withAuthRefresh } from "./auth-request"

export async function getGiftCards() {
  const authHeaders = await getAuthHeadersWithRefresh()

  if (!authHeaders.token) {
    return { data: [], meta: { page: 1, limit: 25, count: 0, pages: 0 } }
  }

  try {
    return await withAuthRefresh(async (headers) => {
      const client = getSpreeClient()
      return await client.customer.giftCards.list(undefined, headers)
    })
  } catch {
    return { data: [], meta: { page: 1, limit: 25, count: 0, pages: 0 } }
  }
}

export async function getGiftCard(id: string) {
  try {
    return await withAuthRefresh(async (headers) => {
      const client = getSpreeClient()
      return await client.customer.giftCards.get(id, headers)
    })
  } catch {
    return null
  }
}
