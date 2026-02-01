"use server"

import { getAuthHeaders } from "./cookies"
import { updateTag } from "next/cache"

// Credit card type (matches SDK StoreCreditCard)
interface CreditCard {
  id: string
  cc_type: string
  last_digits: string
  month: number
  year: number
  name: string | null
  default: boolean
}

interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    count: number
    pages: number
  }
}

const emptyResponse: PaginatedResponse<CreditCard> = {
  data: [],
  meta: { page: 1, limit: 25, count: 0, pages: 0 }
}

export async function getCreditCards(): Promise<PaginatedResponse<CreditCard>> {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders.token) {
    return emptyResponse
  }

  try {
    // Direct API call since SDK may not have creditCards yet
    const baseUrl = process.env.SPREE_API_URL || 'http://localhost:3000'
    const apiKey = process.env.SPREE_API_KEY || ''

    const response = await fetch(`${baseUrl}/api/v3/store/customer/credit_cards`, {
      headers: {
        'Content-Type': 'application/json',
        'x-spree-api-key': apiKey,
        'Authorization': `Bearer ${authHeaders.token}`,
      },
    })

    if (!response.ok) {
      return emptyResponse
    }

    return response.json()
  } catch {
    return emptyResponse
  }
}

export async function deleteCreditCard(id: string) {
  const authHeaders = await getAuthHeaders()

  if (!authHeaders.token) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const baseUrl = process.env.SPREE_API_URL || 'http://localhost:3000'
    const apiKey = process.env.SPREE_API_KEY || ''

    const response = await fetch(`${baseUrl}/api/v3/store/customer/credit_cards/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-spree-api-key': apiKey,
        'Authorization': `Bearer ${authHeaders.token}`,
      },
    })

    if (!response.ok) {
      return { success: false, error: "Failed to delete credit card" }
    }

    updateTag("credit-cards")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete credit card"
    }
  }
}
