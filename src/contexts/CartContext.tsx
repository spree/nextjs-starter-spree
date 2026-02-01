'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { StoreOrder, StoreLineItem } from '@spree/sdk'
import {
  getCart as getCartAction,
  addToCart as addToCartAction,
  updateCartItem as updateCartItemAction,
  removeCartItem as removeCartItemAction,
} from '@/lib/data/cart'

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

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<StoreOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshCart = useCallback(async () => {
    try {
      const cartData = await getCartAction()
      setCart(cartData)
    } catch {
      setCart(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const addItem = useCallback(async (variantId: string, quantity = 1) => {
    try {
      const updatedCart = await addToCartAction(variantId, quantity)
      setCart(updatedCart)
      router.refresh()
    } catch (error) {
      console.error('Failed to add item to cart:', error)
      throw error
    }
  }, [router])

  const updateItem = useCallback(async (lineItemId: string, quantity: number) => {
    try {
      const updatedCart = await updateCartItemAction(lineItemId, quantity)
      setCart(updatedCart)
      router.refresh()
    } catch (error) {
      console.error('Failed to update cart item:', error)
      throw error
    }
  }, [router])

  const removeItem = useCallback(async (lineItemId: string) => {
    try {
      const updatedCart = await removeCartItemAction(lineItemId)
      setCart(updatedCart)
      router.refresh()
    } catch (error) {
      console.error('Failed to remove cart item:', error)
      throw error
    }
  }, [router])

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
