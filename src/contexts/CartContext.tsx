'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { getSpreeClient } from '@/lib/spree'
import type { StoreOrder, StoreLineItem } from '@spree/sdk'

interface CartContextType {
  cart: StoreOrder | null
  loading: boolean
  itemCount: number
  addItem: (variantId: string, quantity?: number) => Promise<void>
  updateItem: (lineItemId: string, quantity: number) => Promise<void>
  removeItem: (lineItemId: string) => Promise<void>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_TOKEN_KEY = 'spree_order_token'

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<StoreOrder | null>(null)
  const [loading, setLoading] = useState(true)

  const getOrderToken = (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(CART_TOKEN_KEY)
  }

  const setOrderToken = (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_TOKEN_KEY, token)
    }
  }

  const refreshCart = useCallback(async () => {
    const client = getSpreeClient()
    const orderToken = getOrderToken()

    if (!orderToken) {
      setCart(null)
      setLoading(false)
      return
    }

    try {
      // Try to fetch the cart using the stored token
      // We need to get it by listing orders or implement a current cart endpoint
      const response = await client.orders.list(
        { 'q[state_eq]': 'cart' as unknown as string },
        { orderToken }
      )
      if (response.data.length > 0) {
        setCart(response.data[0])
      } else {
        setCart(null)
        localStorage.removeItem(CART_TOKEN_KEY)
      }
    } catch {
      setCart(null)
      localStorage.removeItem(CART_TOKEN_KEY)
    } finally {
      setLoading(false)
    }
  }, [])

  const createCart = async (): Promise<StoreOrder & { order_token: string }> => {
    const client = getSpreeClient()
    const newCart = await client.orders.create()
    setOrderToken(newCart.order_token)
    return newCart
  }

  const addItem = async (variantId: string, quantity = 1) => {
    const client = getSpreeClient()
    let orderToken = getOrderToken()
    let currentCart = cart

    // Create cart if doesn't exist
    if (!orderToken || !currentCart) {
      const newCart = await createCart()
      orderToken = newCart.order_token
      currentCart = newCart
    }

    await client.orders.lineItems.create(
      currentCart!.id,
      { variant_id: variantId, quantity },
      { orderToken: orderToken! }
    )

    await refreshCart()
  }

  const updateItem = async (lineItemId: string, quantity: number) => {
    const client = getSpreeClient()
    const orderToken = getOrderToken()

    if (!cart || !orderToken) return

    await client.orders.lineItems.update(
      cart.id,
      lineItemId,
      { quantity },
      { orderToken }
    )

    await refreshCart()
  }

  const removeItem = async (lineItemId: string) => {
    const client = getSpreeClient()
    const orderToken = getOrderToken()

    if (!cart || !orderToken) return

    await client.orders.lineItems.delete(cart.id, lineItemId, { orderToken })
    await refreshCart()
  }

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const itemCount = cart?.line_items?.reduce(
    (sum: number, item: StoreLineItem) => sum + item.quantity,
    0
  ) ?? 0

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount,
        addItem,
        updateItem,
        removeItem,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
