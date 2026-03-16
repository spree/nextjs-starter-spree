import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@spree/next", () => ({
  createPaymentSession: vi.fn(),
  completePaymentSession: vi.fn(),
  complete: vi.fn(),
  getCart: vi.fn(),
}));

import {
  complete,
  completePaymentSession,
  createPaymentSession,
  getCart,
} from "@spree/next";

import {
  completeCheckoutOrder,
  completeCheckoutPaymentSession,
  confirmPaymentAndCompleteCart,
  createCheckoutPaymentSession,
} from "@/lib/data/payment";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test fixtures are intentionally partial
const mockCreatePaymentSession = createPaymentSession as any;
const mockCompletePaymentSession = completePaymentSession as any;
const mockComplete = complete as any;
const mockGetCart = getCart as any;

const mockSession = {
  id: "session-1",
  status: "pending",
  external_data: { client_secret: "pi_secret_123" },
};

const mockOrder = {
  id: "cart-1",
  number: "R100",
  current_step: "complete",
};

describe("payment server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCheckoutPaymentSession", () => {
    it("returns success with session", async () => {
      mockCreatePaymentSession.mockResolvedValue(mockSession);

      const result = await createCheckoutPaymentSession("cart-1", "pm-1");

      expect(mockCreatePaymentSession).toHaveBeenCalledWith({
        payment_method_id: "pm-1",
      });
      expect(result).toEqual({ success: true, session: mockSession });
    });

    it("passes stripe payment method id in external_data", async () => {
      mockCreatePaymentSession.mockResolvedValue(mockSession);

      await createCheckoutPaymentSession("cart-1", "pm-1", "spm_123");

      expect(mockCreatePaymentSession).toHaveBeenCalledWith({
        payment_method_id: "pm-1",
        external_data: { stripe_payment_method_id: "spm_123" },
      });
    });

    it("returns error on failure", async () => {
      mockCreatePaymentSession.mockRejectedValue(
        new Error("Gateway unavailable"),
      );

      const result = await createCheckoutPaymentSession("cart-1", "pm-1");

      expect(result).toEqual({
        success: false,
        error: "Gateway unavailable",
      });
    });
  });

  describe("completeCheckoutPaymentSession", () => {
    it("returns success with session", async () => {
      const completedSession = { ...mockSession, status: "completed" };
      mockCompletePaymentSession.mockResolvedValue(completedSession);

      const result = await completeCheckoutPaymentSession(
        "cart-1",
        "session-1",
      );

      expect(mockCompletePaymentSession).toHaveBeenCalledWith("session-1");
      expect(result).toEqual({ success: true, session: completedSession });
    });

    it("returns error on failure", async () => {
      mockCompletePaymentSession.mockRejectedValue(
        new Error("Session expired"),
      );

      const result = await completeCheckoutPaymentSession(
        "cart-1",
        "session-1",
      );

      expect(result).toEqual({ success: false, error: "Session expired" });
    });
  });

  describe("completeCheckoutOrder", () => {
    it("returns success with order", async () => {
      mockComplete.mockResolvedValue(mockOrder);

      const result = await completeCheckoutOrder("cart-1");

      expect(mockComplete).toHaveBeenCalledWith("cart-1");
      expect(result).toEqual({ success: true, order: mockOrder });
    });

    it("treats 403 as success (order already completed)", async () => {
      const spreeError = Object.assign(new Error("Not authorized"), {
        status: 403,
      });
      mockComplete.mockRejectedValue(spreeError);

      const result = await completeCheckoutOrder("cart-1");

      expect(result).toEqual({ success: true, order: null });
    });

    it("treats 422 as success (state_lock_version conflict)", async () => {
      const spreeError = Object.assign(new Error("Unprocessable Content"), {
        status: 422,
      });
      mockComplete.mockRejectedValue(spreeError);

      const result = await completeCheckoutOrder("cart-1");

      expect(result).toEqual({ success: true, order: null });
    });

    it("returns error on non-403 failure", async () => {
      mockComplete.mockRejectedValue(new Error("Payment required"));

      const result = await completeCheckoutOrder("cart-1");

      expect(result).toEqual({ success: false, error: "Payment required" });
    });

    it("returns fallback message for non-Error throws", async () => {
      mockComplete.mockRejectedValue("unexpected");

      const result = await completeCheckoutOrder("cart-1");

      expect(result).toEqual({
        success: false,
        error: "Failed to complete order",
      });
    });
  });

  describe("confirmPaymentAndCompleteCart", () => {
    it("passes cartId to getCart for explicit lookup", async () => {
      mockGetCart.mockResolvedValue({
        id: "cart-1",
        current_step: "complete",
      });

      await confirmPaymentAndCompleteCart("cart-1", "session-1");

      expect(mockGetCart).toHaveBeenCalledWith("cart-1");
    });

    it("succeeds when cart is already complete", async () => {
      mockGetCart.mockResolvedValue({
        id: "cart-1",
        current_step: "complete",
      });

      const result = await confirmPaymentAndCompleteCart("cart-1", "session-1");

      expect(result).toEqual({
        success: true,
        order: { id: "cart-1", current_step: "complete" },
      });
      expect(mockCompletePaymentSession).not.toHaveBeenCalled();
      expect(mockComplete).not.toHaveBeenCalled();
    });

    it("completes payment session then completes the order", async () => {
      mockGetCart.mockResolvedValue({
        id: "cart-1",
        current_step: "payment",
      });
      mockCompletePaymentSession.mockResolvedValue({
        id: "session-1",
        status: "completed",
      });
      mockComplete.mockResolvedValue(mockOrder);

      const result = await confirmPaymentAndCompleteCart("cart-1", "session-1");

      expect(mockCompletePaymentSession).toHaveBeenCalledWith("session-1");
      expect(mockComplete).toHaveBeenCalledWith("cart-1");
      expect(result).toEqual({ success: true, order: mockOrder });
    });

    it("returns error when payment session fails", async () => {
      mockGetCart.mockResolvedValue({
        id: "cart-1",
        current_step: "payment",
      });
      mockCompletePaymentSession.mockResolvedValue({
        id: "session-1",
        status: "failed",
      });

      const result = await confirmPaymentAndCompleteCart("cart-1", "session-1");

      expect(result).toEqual({
        success: false,
        error: "Payment was not successful. Please try again.",
      });
      expect(mockComplete).not.toHaveBeenCalled();
    });

    it("skips session completion when no session ID provided", async () => {
      mockGetCart.mockResolvedValue({
        id: "cart-1",
        current_step: "payment",
      });
      mockComplete.mockResolvedValue(mockOrder);

      const result = await confirmPaymentAndCompleteCart("cart-1");

      expect(mockCompletePaymentSession).not.toHaveBeenCalled();
      expect(mockComplete).toHaveBeenCalledWith("cart-1");
      expect(result).toEqual({ success: true, order: mockOrder });
    });

    it("returns success when cart is not found (already completed by webhook)", async () => {
      mockGetCart.mockResolvedValue(null);

      const result = await confirmPaymentAndCompleteCart("cart-1", "session-1");

      expect(mockComplete).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true, order: null });
    });

    it("returns error when complete throws non-403 error", async () => {
      mockGetCart.mockResolvedValue({
        id: "cart-1",
        current_step: "payment",
      });
      mockComplete.mockRejectedValue(new Error("Order cannot be completed"));

      const result = await confirmPaymentAndCompleteCart("cart-1");

      expect(result).toEqual({
        success: false,
        error: "Order cannot be completed",
      });
    });

    it("treats 403 from complete as success (order already completed)", async () => {
      mockGetCart.mockResolvedValue({
        id: "cart-1",
        current_step: "payment",
      });
      const spreeError = Object.assign(new Error("Not authorized"), {
        status: 403,
      });
      mockComplete.mockRejectedValue(spreeError);

      const result = await confirmPaymentAndCompleteCart("cart-1");

      expect(result).toEqual({ success: true, order: null });
    });

    it("returns fallback message for non-Error throws", async () => {
      mockGetCart.mockRejectedValue("unexpected");

      const result = await confirmPaymentAndCompleteCart("cart-1");

      expect(result).toEqual({
        success: false,
        error: "Failed to confirm payment. Please try again.",
      });
    });
  });
});
