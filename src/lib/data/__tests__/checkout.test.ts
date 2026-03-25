import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@spree/next", () => ({
  getCart: vi.fn(),
  getOrder: vi.fn(),
  updateCart: vi.fn(),
  selectDeliveryRate: vi.fn(),
  applyDiscountCode: vi.fn(),
  applyGiftCard: vi.fn(),
  removeDiscountCode: vi.fn(),
  removeGiftCard: vi.fn(),
}));

vi.mock("@spree/sdk", () => ({
  SpreeError: class SpreeError extends Error {
    code: string;
    status: number;
    constructor(
      response: { error: { code: string; message: string } },
      status: number,
    ) {
      super(response.error.message);
      this.code = response.error.code;
      this.status = status;
    }
  },
}));

import {
  applyDiscountCode as applyDiscountCodeSdk,
  applyGiftCard as applyGiftCardSdk,
  getCart,
  getOrder,
  removeDiscountCode as removeDiscountCodeSdk,
  removeGiftCard as removeGiftCardSdk,
  selectDeliveryRate as selectDeliveryRateSdk,
  updateCart,
} from "@spree/next";

import {
  applyCode,
  getCheckoutOrder,
  removeDiscountCode,
  removeGiftCard,
  selectDeliveryRate,
  updateOrderAddresses,
  updateOrderMarket,
} from "@/lib/data/checkout";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test fixtures are intentionally partial
const mockGetCart = getCart as any;
const mockGetOrder = getOrder as any;
const mockUpdateCart = updateCart as any;
const mockSelectDeliveryRate = selectDeliveryRateSdk as any;
const mockApplyDiscountCode = applyDiscountCodeSdk as any;
const mockApplyGiftCard = applyGiftCardSdk as any;
const mockRemoveDiscountCode = removeDiscountCodeSdk as any;
const mockRemoveGiftCard = removeGiftCardSdk as any;

const mockOrder = {
  id: "order-1",
  number: "R100",
  current_step: "address",
};
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

  describe("selectDeliveryRate", () => {
    it("returns success", async () => {
      mockSelectDeliveryRate.mockResolvedValue(undefined);

      const result = await selectDeliveryRate("order-1", "ship-1", "rate-1");

      expect(mockSelectDeliveryRate).toHaveBeenCalledWith("ship-1", "rate-1");
      expect(result).toEqual({ success: true });
    });

    it("returns error on failure", async () => {
      mockSelectDeliveryRate.mockRejectedValue(new Error("Rate not available"));

      const result = await selectDeliveryRate("order-1", "ship-1", "rate-1");

      expect(result).toEqual({
        success: false,
        error: "Rate not available",
      });
    });
  });

  describe("applyCode", () => {
    it("applies discount code when valid", async () => {
      mockApplyDiscountCode.mockResolvedValue(mockOrder);

      const result = await applyCode("order-1", "SAVE10");

      expect(result).toEqual({
        success: true,
        cart: mockOrder,
        type: "discount",
      });
      expect(mockApplyDiscountCode).toHaveBeenCalledWith("SAVE10");
      expect(mockApplyGiftCard).not.toHaveBeenCalled();
    });

    it("falls back to gift card when discount code returns 422", async () => {
      const { SpreeError } = await import("@spree/sdk");
      mockApplyDiscountCode.mockRejectedValue(
        new SpreeError(
          { error: { code: "processing_error", message: "Coupon not found" } },
          422,
        ),
      );
      mockApplyGiftCard.mockResolvedValue(mockOrder);

      const result = await applyCode("order-1", "GC-ABCD-1234");

      expect(result).toEqual({
        success: true,
        cart: mockOrder,
        type: "gift_card",
      });
      expect(mockApplyDiscountCode).toHaveBeenCalledWith("GC-ABCD-1234");
      expect(mockApplyGiftCard).toHaveBeenCalledWith("GC-ABCD-1234");
    });

    it("returns error when both discount and gift card fail", async () => {
      const { SpreeError } = await import("@spree/sdk");
      mockApplyDiscountCode.mockRejectedValue(
        new SpreeError(
          { error: { code: "processing_error", message: "Coupon not found" } },
          422,
        ),
      );
      mockApplyGiftCard.mockRejectedValue(
        new SpreeError(
          {
            error: {
              code: "gift_card_not_found",
              message: "Gift card not found",
            },
          },
          404,
        ),
      );

      const result = await applyCode("order-1", "INVALID");

      expect(result).toEqual({
        success: false,
        error: "Coupon not found",
      });
    });

    it("shows backend gift card error when gift card is expired", async () => {
      const { SpreeError } = await import("@spree/sdk");
      mockApplyDiscountCode.mockRejectedValue(
        new SpreeError(
          { error: { code: "processing_error", message: "Coupon not found" } },
          422,
        ),
      );
      mockApplyGiftCard.mockRejectedValue(
        new SpreeError(
          {
            error: {
              code: "gift_card_expired",
              message: "The Gift Card has expired.",
            },
          },
          422,
        ),
      );

      const result = await applyCode("order-1", "EXPIRED-GC");

      expect(result).toEqual({
        success: false,
        error: "The Gift Card has expired.",
      });
    });

    it("does not fall back to gift card on network errors", async () => {
      mockApplyDiscountCode.mockRejectedValue(new Error("Network error"));

      const result = await applyCode("order-1", "SAVE10");

      expect(result).toEqual({ success: false, error: "Network error" });
      expect(mockApplyGiftCard).not.toHaveBeenCalled();
    });

    it("does not fall back to gift card on 500 errors", async () => {
      const { SpreeError } = await import("@spree/sdk");
      mockApplyDiscountCode.mockRejectedValue(
        new SpreeError(
          {
            error: { code: "internal_error", message: "Internal server error" },
          },
          500,
        ),
      );

      const result = await applyCode("order-1", "SAVE10");

      expect(result).toEqual({
        success: false,
        error: "Internal server error",
      });
      expect(mockApplyGiftCard).not.toHaveBeenCalled();
    });
  });

  describe("removeDiscountCode", () => {
    it("returns success with order", async () => {
      mockRemoveDiscountCode.mockResolvedValue(mockOrder);

      const result = await removeDiscountCode("order-1", "SAVE10");

      expect(mockRemoveDiscountCode).toHaveBeenCalledWith("SAVE10");
      expect(result).toEqual({ success: true, cart: mockOrder });
    });

    it("returns error on failure", async () => {
      mockRemoveDiscountCode.mockRejectedValue(
        new Error("Promotion not found"),
      );

      const result = await removeDiscountCode("order-1", "SAVE10");

      expect(result).toEqual({
        success: false,
        error: "Promotion not found",
      });
    });
  });

  describe("removeGiftCard", () => {
    it("returns success with order", async () => {
      mockRemoveGiftCard.mockResolvedValue(mockOrder);

      const result = await removeGiftCard("order-1", "gc_abc123");

      expect(mockRemoveGiftCard).toHaveBeenCalledWith("gc_abc123");
      expect(result).toEqual({ success: true, cart: mockOrder });
    });

    it("returns error on failure", async () => {
      mockRemoveGiftCard.mockRejectedValue(new Error("Gift card not found"));

      const result = await removeGiftCard("order-1", "gc_abc123");

      expect(result).toEqual({
        success: false,
        error: "Gift card not found",
      });
    });
  });
});
