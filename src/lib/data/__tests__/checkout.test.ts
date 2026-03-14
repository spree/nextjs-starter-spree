import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@spree/next", () => ({
  getCart: vi.fn(),
  getOrder: vi.fn(),
  updateCart: vi.fn(),
  getShipments: vi.fn(),
  selectShippingRate: vi.fn(),
  applyCoupon: vi.fn(),
  removeCoupon: vi.fn(),
}));

import {
  applyCoupon,
  getCart,
  getOrder,
  getShipments as getShipmentsSdk,
  removeCoupon,
  selectShippingRate as selectShippingRateSdk,
  updateCart,
} from "@spree/next";

import {
  applyCouponCode,
  getCheckoutOrder,
  getShipments,
  removeCouponCode,
  selectShippingRate,
  updateOrderAddresses,
  updateOrderMarket,
} from "@/lib/data/checkout";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test fixtures are intentionally partial
const mockGetCart = getCart as any;
const mockGetOrder = getOrder as any;
const mockUpdateCart = updateCart as any;
const mockGetShipments = getShipmentsSdk as any;
const mockSelectShippingRate = selectShippingRateSdk as any;
const mockApplyCoupon = applyCoupon as any;
const mockRemoveCoupon = removeCoupon as any;

const mockOrder = {
  id: "order-1",
  number: "R100",
  current_step: "address",
};
const mockShipments = [{ id: "ship-1", shipping_rates: [] }];

describe("checkout server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCheckoutOrder", () => {
    it("returns cart when still in checkout", async () => {
      mockGetCart.mockResolvedValue(mockOrder);

      const result = await getCheckoutOrder("order-1");

      expect(mockGetCart).toHaveBeenCalled();
      expect(mockGetOrder).not.toHaveBeenCalled();
      expect(result).toBe(mockOrder);
    });

    it("falls back to getOrder when cart is null (completed)", async () => {
      const completedOrder = { ...mockOrder, current_step: "complete" };
      mockGetCart.mockResolvedValue(null);
      mockGetOrder.mockResolvedValue(completedOrder);

      const result = await getCheckoutOrder("order-1");

      expect(mockGetCart).toHaveBeenCalled();
      expect(mockGetOrder).toHaveBeenCalledWith("order-1");
      expect(result).toBe(completedOrder);
    });

    it("returns null when both cart and order fail", async () => {
      mockGetCart.mockResolvedValue(null);
      mockGetOrder.mockRejectedValue(new Error("Not found"));

      const result = await getCheckoutOrder("bad-id");

      expect(result).toBeNull();
    });
  });

  describe("updateOrderAddresses", () => {
    it("returns success with order", async () => {
      mockUpdateCart.mockResolvedValue(mockOrder);
      const addresses = { email: "test@example.com" };

      const result = await updateOrderAddresses("order-1", addresses);

      expect(mockUpdateCart).toHaveBeenCalledWith(addresses);
      expect(result).toEqual({ success: true, cart: mockOrder });
    });

    it("returns error on failure", async () => {
      mockUpdateCart.mockRejectedValue(new Error("Invalid address"));

      const result = await updateOrderAddresses("order-1", {});

      expect(result).toEqual({
        success: false,
        error: "Invalid address",
      });
    });

    it("returns fallback message for non-Error throws", async () => {
      mockUpdateCart.mockRejectedValue("unexpected");

      const result = await updateOrderAddresses("order-1", {});

      expect(result).toEqual({
        success: false,
        error: "Failed to update addresses",
      });
    });
  });

  describe("updateOrderMarket", () => {
    it("returns success with updated order", async () => {
      const updatedOrder = { ...mockOrder, currency: "EUR", locale: "de" };
      mockUpdateCart.mockResolvedValue(updatedOrder);

      const result = await updateOrderMarket("order-1", {
        currency: "EUR",
        locale: "de",
      });

      expect(mockUpdateCart).toHaveBeenCalledWith({
        currency: "EUR",
        locale: "de",
      });
      expect(result).toEqual({ success: true, cart: updatedOrder });
    });

    it("returns error on failure", async () => {
      mockUpdateCart.mockRejectedValue(new Error("Currency not supported"));

      const result = await updateOrderMarket("order-1", {
        currency: "XYZ",
        locale: "en",
      });

      expect(result).toEqual({
        success: false,
        error: "Currency not supported",
      });
    });

    it("returns fallback message for non-Error throws", async () => {
      mockUpdateCart.mockRejectedValue("unexpected");

      const result = await updateOrderMarket("order-1", {
        currency: "EUR",
        locale: "de",
      });

      expect(result).toEqual({
        success: false,
        error: "Failed to update order market",
      });
    });
  });

  describe("getShipments", () => {
    it("returns shipment data on success", async () => {
      mockGetShipments.mockResolvedValue({ data: mockShipments });

      const result = await getShipments("order-1");

      expect(mockGetShipments).toHaveBeenCalled();
      expect(result).toBe(mockShipments);
    });

    it("returns empty array on failure", async () => {
      mockGetShipments.mockRejectedValue(new Error("Not found"));

      const result = await getShipments("order-1");

      expect(result).toEqual([]);
    });
  });

  describe("selectShippingRate", () => {
    it("returns success", async () => {
      mockSelectShippingRate.mockResolvedValue(undefined);

      const result = await selectShippingRate("order-1", "ship-1", "rate-1");

      expect(mockSelectShippingRate).toHaveBeenCalledWith("ship-1", "rate-1");
      expect(result).toEqual({ success: true });
    });

    it("returns error on failure", async () => {
      mockSelectShippingRate.mockRejectedValue(new Error("Rate not available"));

      const result = await selectShippingRate("order-1", "ship-1", "rate-1");

      expect(result).toEqual({
        success: false,
        error: "Rate not available",
      });
    });
  });

  describe("applyCouponCode", () => {
    it("returns success with order", async () => {
      mockApplyCoupon.mockResolvedValue(mockOrder);

      const result = await applyCouponCode("order-1", "SAVE10");

      expect(mockApplyCoupon).toHaveBeenCalledWith("SAVE10");
      expect(result).toEqual({ success: true, cart: mockOrder });
    });

    it("returns error on failure", async () => {
      mockApplyCoupon.mockRejectedValue(new Error("Coupon expired"));

      const result = await applyCouponCode("order-1", "EXPIRED");

      expect(result).toEqual({
        success: false,
        error: "Coupon expired",
      });
    });

    it("returns fallback message for non-Error throws", async () => {
      mockApplyCoupon.mockRejectedValue("unexpected");

      const result = await applyCouponCode("order-1", "BAD");

      expect(result).toEqual({
        success: false,
        error: "Failed to apply coupon code",
      });
    });
  });

  describe("removeCouponCode", () => {
    it("returns success with order", async () => {
      mockRemoveCoupon.mockResolvedValue(mockOrder);

      const result = await removeCouponCode("order-1", "promo-1");

      expect(mockRemoveCoupon).toHaveBeenCalledWith("promo-1");
      expect(result).toEqual({ success: true, cart: mockOrder });
    });

    it("returns error on failure", async () => {
      mockRemoveCoupon.mockRejectedValue(new Error("Promotion not found"));

      const result = await removeCouponCode("order-1", "promo-1");

      expect(result).toEqual({
        success: false,
        error: "Promotion not found",
      });
    });
  });
});
