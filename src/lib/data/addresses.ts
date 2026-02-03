"use server"

import { getSpreeClient } from "@/lib/spree"
import { getAuthHeadersWithRefresh } from "./cookies"
import { withAuthRefresh } from "./auth-request"
import { updateTag } from "next/cache"

// Address params for creating/updating addresses
export interface AddressParams {
  firstname: string
  lastname: string
  address1: string
  address2?: string
  city: string
  zipcode: string
  phone?: string
  company?: string
  country_iso: string
  state_abbr?: string
  state_name?: string
}

export async function getAddresses() {
  const authHeaders = await getAuthHeadersWithRefresh()

  if (!authHeaders.token) {
    return { data: [], meta: { page: 1, limit: 25, count: 0, pages: 0 } }
  }

  try {
    return await withAuthRefresh(async (headers) => {
      const client = getSpreeClient()
      return await client.customer.addresses.list(undefined, headers)
    })
  } catch {
    return { data: [], meta: { page: 1, limit: 25, count: 0, pages: 0 } }
  }
}

export async function getAddress(id: string) {
  const authHeaders = await getAuthHeadersWithRefresh()

  if (!authHeaders.token) {
    return null
  }

  try {
    return await withAuthRefresh(async (headers) => {
      const client = getSpreeClient()
      return await client.customer.addresses.get(id, headers)
    })
  } catch {
    return null
  }
}

export async function createAddress(address: AddressParams) {
  try {
    const result = await withAuthRefresh(async (headers) => {
      const client = getSpreeClient()
      return await client.customer.addresses.create(address as never, headers)
    })
    updateTag("addresses")
    return { success: true, address: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create address"
    }
  }
}

export async function updateAddress(id: string, address: Partial<AddressParams>) {
  try {
    const result = await withAuthRefresh(async (headers) => {
      const client = getSpreeClient()
      return await client.customer.addresses.update(id, address as never, headers)
    })
    updateTag("addresses")
    return { success: true, address: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update address"
    }
  }
}

export async function deleteAddress(id: string) {
  try {
    await withAuthRefresh(async (headers) => {
      const client = getSpreeClient()
      return await client.customer.addresses.delete(id, headers)
    })
    updateTag("addresses")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete address"
    }
  }
}
