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
  channel: {
    get: vi.fn().mockResolvedValue({ id: "ch-dtc", code: "public" }),
  },
};

const { mockGetCartId } = vi.hoisted(() => ({ mockGetCartId: vi.fn() }));

vi.mock("@/lib/spree", () => ({
  getClient: () => mockClient,
  getClientForSurface: () => mockClient,
  cacheTagSuffix: () => "",
  DEFAULT_SURFACE: "dtc",
  isWholesaleEnabled: vi.fn().mockReturnValue(false),
  getCartToken: vi.fn().mockResolvedValue("order-token-123"),
  // Surface-aware default is (re)installed in beforeEach — clearAllMocks resets
  // implementations, so setting it here would not survive.
  getCartId: mockGetCartId,
  getAccessToken: vi.fn().mockResolvedValue(undefined),
  getLocaleOptions: vi.fn().mockResolvedValue({ locale: "en", country: "us" }),
  setCartCookies: vi.fn(),
  clearCartCookies: vi.fn(),
  // Real logic against the mocked getCartId — the DTC cookie is poisoned when
  // it holds the wholesale cart's id.
  isPoisonedDtcCartId: async (cartId: string, surface: string) => {
    if (surface !== "dtc") return false;
    const wholesaleCartId = await mockGetCartId("wholesale");
    return Boolean(wholesaleCartId) && wholesaleCartId === cartId;
  },
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
  beforeEach(async () => {
    vi.clearAllMocks();
    // Surface-aware cart-id cookie: only DTC has one by default, so the
    // cross-surface poison guard sees no wholesale cookie to collide with.
    const { getCartId } = await import("@/lib/spree");
    (getCartId as ReturnType<typeof vi.fn>).mockImplementation(
      async (surface = "dtc") =>
        surface === "wholesale" ? undefined : "cart-1",
    );
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

    it("drops a DTC cookie poisoned with the wholesale cart id and returns null", async () => {
      const { getCartId, clearCartCookies } = await import("@/lib/spree");
      // Both surfaces' cookies point at the same cart — the pre-fix poisoning.
      (getCartId as ReturnType<typeof vi.fn>).mockResolvedValue("cart-1");

      const result = await getCart(undefined, "dtc");

      expect(result).toBeNull();
      expect(mockClient.carts.get).not.toHaveBeenCalled();
      expect(clearCartCookies).toHaveBeenCalledWith("dtc");
    });

    it("keeps the wholesale cart even when the DTC cookie collides (directional guard)", async () => {
      const { getCartId } = await import("@/lib/spree");
      (getCartId as ReturnType<typeof vi.fn>).mockResolvedValue("cart-1");
      mockClient.carts.get.mockResolvedValue(mockCart);

      const result = await getCart(undefined, "wholesale");

      expect(result).toBe(mockCart);
    });

    it("drops a cookie cart whose channel_id does not match the surface", async () => {
      const { clearCartCookies } = await import("@/lib/spree");
      mockClient.carts.get.mockResolvedValue({
        ...mockCart,
        channel_id: "ch-wholesale",
      });
      // DTC surface resolves to ch-dtc (mockClient.channel.get), so ch-wholesale
      // is a confirmed mismatch.
      const result = await getCart(undefined, "dtc");

      expect(result).toBeNull();
      expect(clearCartCookies).toHaveBeenCalledWith("dtc");
    });

    it("keeps a cookie cart whose channel_id matches the surface", async () => {
      mockClient.carts.get.mockResolvedValue({
        ...mockCart,
        channel_id: "ch-dtc",
      });
      const result = await getCart(undefined, "dtc");

      expect(result).toMatchObject({ id: "cart-1" });
    });
  });

  describe("getOrCreateCart", () => {
    it("returns existing cart if found", async () => {
      mockClient.carts.get.mockResolvedValue(mockCart);
      const result = await getOrCreateCart();
      expect(result).toBe(mockCart);
      expect(mockClient.carts.create).not.toHaveBeenCalled();
    });

    it("passes locale options when creating a new cart", async () => {
      const { getCartId, getLocaleOptions } = await import("@/lib/spree");
      (getCartId as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
      (getLocaleOptions as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        locale: "de",
        country: "de",
      });
      mockClient.carts.create.mockResolvedValue(mockCart);

      await getOrCreateCart();

      expect(mockClient.carts.create).toHaveBeenCalledWith(undefined, {
        locale: "de",
        country: "de",
      });
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
        {
          spreeToken: "order-token-123",
          token: undefined,
        },
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
      const { getAccessToken } = await import("@/lib/spree");
      (getAccessToken as ReturnType<typeof vi.fn>).mockResolvedValue(
        "jwt-token",
      );
      mockClient.carts.associate.mockResolvedValue({});

      const result = await associateCartWithUser();

      expect(result).toEqual({ success: true });
    });
  });
});
