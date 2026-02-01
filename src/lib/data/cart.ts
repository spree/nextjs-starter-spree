"use server"

import { cookies } from "next/headers"
import { getSpreeClient } from "@/lib/spree"
import { updateTag } from "next/cache"

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
