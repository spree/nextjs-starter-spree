"use client";

import type { StoreLineItem, StoreOrder } from "@spree/sdk";
import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  addToCart as addToCartAction,
  getCart as getCartAction,
  removeCartItem as removeCartItemAction,
  updateCartItem as updateCartItemAction,
} from "@/lib/data/cart";

interface CartContextType {
  cart: StoreOrder | null;
  loading: boolean;
  updating: boolean;
  itemCount: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (lineItemId: string, quantity: number) => Promise<void>;
  removeItem: (lineItemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<StoreOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const refreshCart = useCallback(async () => {
    try {
      const cartData = await getCartAction();
      setCart(cartData);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      setUpdating(true);
      try {
        const updatedCart = await addToCartAction(variantId, quantity);
        setCart(updatedCart);
        setIsOpen(true); // Open cart drawer after adding
        router.refresh();
      } catch (error) {
        console.error("Failed to add item to cart:", error);
        throw error;
      } finally {
        setUpdating(false);
      }
    },
    [router],
  );

  const updateItem = useCallback(
    async (lineItemId: string, quantity: number) => {
      setUpdating(true);
      try {
        const updatedCart = await updateCartItemAction(lineItemId, quantity);
        setCart(updatedCart);
        router.refresh();
      } catch (error) {
        console.error("Failed to update cart item:", error);
        throw error;
      } finally {
        setUpdating(false);
      }
    },
    [router],
  );

  const removeItem = useCallback(
    async (lineItemId: string) => {
      setUpdating(true);
      try {
        const updatedCart = await removeCartItemAction(lineItemId);
        setCart(updatedCart);
        router.refresh();
      } catch (error) {
        console.error("Failed to remove cart item:", error);
        throw error;
      } finally {
        setUpdating(false);
      }
    },
    [router],
  );

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const itemCount =
    cart?.line_items?.reduce(
      (sum: number, item: StoreLineItem) => sum + item.quantity,
      0,
    ) ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        updating,
        itemCount,
        isOpen,
        openCart,
        closeCart,
        addItem,
        updateItem,
        removeItem,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
