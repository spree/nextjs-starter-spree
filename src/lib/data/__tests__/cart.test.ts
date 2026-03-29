import { beforeEach, describe, expect, it, vi } from "vitest";

const mockClient = {
  carts: {
    get: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    associate: vi.fn(),
    items: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
};

vi.mock("@spree/next", () => ({
  getClient: () => mockClient,
  getCartToken: vi.fn().mockResolvedValue("order-token-123"),
  getCartId: vi.fn().mockResolvedValue("cart-1"),
  getAccessToken: vi.fn().mockResolvedValue(undefined),
  setCartCookies: vi.fn(),
  clearCartCookies: vi.fn(),
  getCartOptions: vi.fn().mockResolvedValue({
    spreeToken: "order-token-123",
    token: undefined,
  }),
  requireCartId: vi.fn().mockResolvedValue("cart-1"),
}));

vi.mock("next/cache", () => ({
  updateTag: vi.fn(),
}));

import {
  addToCart,
  associateCartWithUser,
  clearCart,
  getCart,
  getOrCreateCart,
  removeCartItem,
  updateCartItem,
} from "@/lib/data/cart";

// Minimal cart fixture for tests
const mockCart = {
  id: "cart-1",
  number: "R123456",
  state: "cart",
  token: "order-token-123",
  items: [],
  total: "0.00",
};

describe("cart server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCart", () => {
    it("fetches cart by ID and token", async () => {
      mockClient.carts.get.mockResolvedValue(mockCart);
      const result = await getCart();
      expect(mockClient.carts.get).toHaveBeenCalledWith("cart-1", {
        spreeToken: "order-token-123",
        token: undefined,
      });
      expect(result).toBe(mockCart);
    });
  });

  describe("getOrCreateCart", () => {
    it("returns existing cart if found", async () => {
      mockClient.carts.get.mockResolvedValue(mockCart);
      const result = await getOrCreateCart();
      expect(result).toBe(mockCart);
      expect(mockClient.carts.create).not.toHaveBeenCalled();
    });
  });

  describe("addToCart", () => {
    it("returns success with cart", async () => {
      mockClient.carts.get.mockResolvedValue(mockCart);
      mockClient.carts.items.create.mockResolvedValue(mockCart);

      const result = await addToCart("variant-1", 2);

      expect(mockClient.carts.items.create).toHaveBeenCalledWith(
        "cart-1",
        { variant_id: "variant-1", quantity: 2 },
        { spreeToken: "order-token-123", token: undefined },
      );
      expect(result).toEqual({ success: true, cart: mockCart });
    });

    it("returns error when addItem throws", async () => {
      mockClient.carts.get.mockResolvedValue(mockCart);
      mockClient.carts.items.create.mockRejectedValue(
        new Error("Variant not found"),
      );

      const result = await addToCart("bad-variant", 1);

      expect(result).toEqual({
        success: false,
        error: "Variant not found",
      });
    });

    it("returns fallback message for non-Error throws", async () => {
      mockClient.carts.get.mockResolvedValue(mockCart);
      mockClient.carts.items.create.mockRejectedValue("unexpected");

      const result = await addToCart("variant-1", 1);

      expect(result).toEqual({
        success: false,
        error: "Failed to add item to cart",
      });
    });
  });

  describe("updateCartItem", () => {
    it("returns success with refreshed cart", async () => {
      mockClient.carts.items.update.mockResolvedValue(mockCart);

      const result = await updateCartItem("li-1", 3);

      expect(mockClient.carts.items.update).toHaveBeenCalledWith(
        "cart-1",
        "li-1",
        { quantity: 3 },
        { spreeToken: "order-token-123", token: undefined },
      );
      expect(result).toEqual({ success: true, cart: mockCart });
    });

    it("returns error on failure", async () => {
      mockClient.carts.items.update.mockRejectedValue(
        new Error("Insufficient stock"),
      );

      const result = await updateCartItem("li-1", 999);

      expect(result).toEqual({
        success: false,
        error: "Insufficient stock",
      });
    });
  });

  describe("removeCartItem", () => {
    it("returns success with refreshed cart", async () => {
      mockClient.carts.items.delete.mockResolvedValue(mockCart);

      const result = await removeCartItem("li-1");

      expect(mockClient.carts.items.delete).toHaveBeenCalledWith(
        "cart-1",
        "li-1",
        { spreeToken: "order-token-123", token: undefined },
      );
      expect(result).toEqual({ success: true, cart: mockCart });
    });

    it("returns error on failure", async () => {
      mockClient.carts.items.delete.mockRejectedValue(
        new Error("Item not found"),
      );

      const result = await removeCartItem("li-999");

      expect(result).toEqual({
        success: false,
        error: "Item not found",
      });
    });
  });

  describe("clearCart", () => {
    it("returns success", async () => {
      const result = await clearCart();
      expect(result).toEqual({ success: true });
    });
  });

  describe("associateCartWithUser", () => {
    it("returns success", async () => {
      const { getAccessToken } = await import("@spree/next");
      (getAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue(
        "jwt-token",
      );
      mockClient.carts.associate.mockResolvedValue({});

      const result = await associateCartWithUser();

      expect(result).toEqual({ success: true });
    });
  });
});
