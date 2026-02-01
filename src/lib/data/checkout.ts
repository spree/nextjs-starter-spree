"use server"

import { getSpreeClient } from "@/lib/spree"
import { getAuthHeaders } from "./cookies"
import { getCartToken } from "./cart"
import { updateTag } from "next/cache"
import type { AddressParams } from "@spree/sdk"

interface CheckoutOptions {
  currency?: string
  locale?: string
}

/**
 * Get checkout auth options - uses JWT for authenticated users, order token for guests
 */
async function getCheckoutAuth() {
  const authHeaders = await getAuthHeaders()
  const orderToken = await getCartToken()

  // JWT takes precedence over order token
  if (authHeaders.token) {
    return { token: authHeaders.token }
  }

  // Fall back to order token for guest checkout
  if (orderToken) {
    return { orderToken }
  }

  return {}
}

/**
 * Get order for checkout - validates access permissions
 */
export async function getCheckoutOrder(orderId: string, options?: CheckoutOptions) {
  const client = getSpreeClient()
  const auth = await getCheckoutAuth()

  try {
    const order = await client.orders.get(
      orderId,
      { includes: "line_items,shipments,order_promotions,bill_address,ship_address" },
      { ...auth, ...options }
    )
    return order
  } catch {
    return null
  }
}

/**
 * Update order addresses
 */
export async function updateOrderAddresses(
  orderId: string,
  addresses: {
    ship_address_attributes?: AddressParams
    bill_address_attributes?: AddressParams
    email?: string
  },
  options?: CheckoutOptions
) {
  const client = getSpreeClient()
  const auth = await getCheckoutAuth()

  try {
    const order = await client.orders.update(orderId, addresses, { ...auth, ...options })
    updateTag("checkout")
    return { success: true, order }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update addresses",
    }
  }
}

/**
 * Advance order to next checkout step
 */
export async function advanceCheckout(orderId: string, options?: CheckoutOptions) {
  const client = getSpreeClient()
  const auth = await getCheckoutAuth()

  try {
    const order = await client.orders.next(orderId, { ...auth, ...options })
    updateTag("checkout")
    updateTag("cart")
    return { success: true, order }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to advance checkout",
    }
  }
}

/**
 * Get shipments for order
 */
export async function getShipments(orderId: string, options?: CheckoutOptions) {
  const client = getSpreeClient()
  const auth = await getCheckoutAuth()

  try {
    const response = await client.orders.shipments.list(orderId, { ...auth, ...options })
    return response.data
  } catch {
    return []
  }
}

/**
 * Select shipping rate for a shipment
 */
export async function selectShippingRate(
  orderId: string,
  shipmentId: string,
  shippingRateId: string,
  options?: CheckoutOptions
) {
  const client = getSpreeClient()
  const auth = await getCheckoutAuth()

  try {
    await client.orders.shipments.update(
      orderId,
      shipmentId,
      { selected_shipping_rate_id: shippingRateId },
      { ...auth, ...options }
    )
    updateTag("checkout")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to select shipping rate",
    }
  }
}

/**
 * Apply coupon code to order
 */
export async function applyCouponCode(
  orderId: string,
  couponCode: string,
  options?: CheckoutOptions
) {
  const client = getSpreeClient()
  const auth = await getCheckoutAuth()

  try {
    const order = await client.orders.couponCodes.apply(orderId, couponCode, {
      ...auth,
      ...options,
    })
    updateTag("checkout")
    updateTag("cart")
    return { success: true, order }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Invalid coupon code",
    }
  }
}

/**
 * Remove coupon code from order
 */
export async function removeCouponCode(
  orderId: string,
  promotionId: string,
  options?: CheckoutOptions
) {
  const client = getSpreeClient()
  const auth = await getCheckoutAuth()

  try {
    const order = await client.orders.couponCodes.remove(orderId, promotionId, {
      ...auth,
      ...options,
    })
    updateTag("checkout")
    updateTag("cart")
    return { success: true, order }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove coupon code",
    }
  }
}

/**
 * Complete the order (skip payment for now)
 */
export async function completeOrder(orderId: string, options?: CheckoutOptions) {
  const client = getSpreeClient()
  const auth = await getCheckoutAuth()

  try {
    const order = await client.orders.complete(orderId, { ...auth, ...options })
    updateTag("checkout")
    updateTag("cart")
    return { success: true, order }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to complete order",
    }
  }
}
