"use server"

import { cookies } from "next/headers"
import { getSpreeClient } from "@/lib/spree"
import { updateTag } from "next/cache"
import { getAuthHeaders } from "./cookies"

const CART_TOKEN_KEY = "_spree_cart_token"

export async function getCartToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(CART_TOKEN_KEY)?.value
}

export async function setCartToken(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(CART_TOKEN_KEY, token, {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
}

export async function removeCartToken() {
  const cookieStore = await cookies()
  cookieStore.set(CART_TOKEN_KEY, "", {
    maxAge: -1,
    path: "/",
  })
}

interface CartOptions {
  currency?: string
  locale?: string
}

/**
 * Get current cart (returns null if none exists)
 */
export async function getCart(options?: CartOptions) {
  const orderToken = await getCartToken()
  const client = getSpreeClient()

  try {
    const cart = await client.cart.get({ orderToken, ...options })
    return cart
  } catch {
    // Cart not found (404) or invalid token
    return null
  }
}

/**
 * Create a new cart
 */
export async function createCart(options?: CartOptions) {
  const client = getSpreeClient()
  const cart = await client.cart.create(options)

  // Store the token for future requests
  if (cart.token) {
    await setCartToken(cart.token)
  }

  updateTag("cart")
  return cart
}

/**
 * Get existing cart or create a new one
 */
export async function getOrCreateCart(options?: CartOptions) {
  const cart = await getCart(options)
  if (cart) return cart
  return createCart(options)
}

/**
 * Add item to cart (creates cart if needed)
 */
export async function addToCart(
  variantId: string,
  quantity: number,
  options?: CartOptions
) {
  const cart = await getOrCreateCart(options)
  const orderToken = cart.token
  const client = getSpreeClient()

  await client.orders.lineItems.create(
    cart.id,
    { variant_id: variantId, quantity },
    { orderToken, ...options }
  )

  updateTag("cart")

  // Return updated cart
  return client.cart.get({ orderToken, ...options })
}

/**
 * Update item quantity in cart
 */
export async function updateCartItem(
  lineItemId: string,
  quantity: number,
  options?: CartOptions
) {
  const orderToken = await getCartToken()
  if (!orderToken) throw new Error("No cart found")

  const client = getSpreeClient()
  const cart = await client.cart.get({ orderToken, ...options })

  await client.orders.lineItems.update(
    cart.id,
    lineItemId,
    { quantity },
    { orderToken, ...options }
  )

  updateTag("cart")

  // Return updated cart
  return client.cart.get({ orderToken, ...options })
}

/**
 * Remove item from cart
 */
export async function removeCartItem(
  lineItemId: string,
  options?: CartOptions
) {
  const orderToken = await getCartToken()
  if (!orderToken) throw new Error("No cart found")

  const client = getSpreeClient()
  const cart = await client.cart.get({ orderToken, ...options })

  await client.orders.lineItems.delete(cart.id, lineItemId, {
    orderToken,
    ...options,
  })

  updateTag("cart")

  // Return updated cart
  return client.cart.get({ orderToken, ...options })
}

/**
 * Clear cart token (effectively abandons the cart)
 */
export async function clearCart() {
  await removeCartToken()
  updateTag("cart")
}

/**
 * Associate guest cart with the currently authenticated user
 * Should be called after login/register when user has a guest cart
 *
 * If association fails (e.g., cart belongs to another user), the cart token
 * is cleared so the user starts fresh with their authenticated account.
 */
export async function associateCartWithUser() {
  const orderToken = await getCartToken()
  if (!orderToken) {
    // No guest cart to associate
    return { success: true }
  }

  const authHeaders = await getAuthHeaders()
  if (!authHeaders.token) {
    // Not authenticated
    return { success: false, error: "Not authenticated" }
  }

  try {
    const client = getSpreeClient()
    await client.cart.associate({ orderToken, token: authHeaders.token })
    updateTag("cart")
    return { success: true }
  } catch (error) {
    // Cart might already be associated or belong to another user
    // Clear the invalid cart token so user doesn't get stuck with inaccessible cart
    console.error("Failed to associate cart, clearing cart token:", error)
    await removeCartToken()
    updateTag("cart")
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to associate cart"
    }
  }
}
