"use server";

import type { Order } from "@spree/sdk";
import { updateTag } from "next/cache";
import { getCartOptions, getClient, requireCartId } from "@/lib/spree";
import { getCart } from "./cart";
import { getOrder } from "./orders";
import { actionResult } from "./utils";

export async function createCheckoutPaymentSession(
  cartId: string,
  paymentMethodId: string,
  externalData?: Record<string, unknown>,
) {
  return actionResult(async () => {
    const options = await getCartOptions();
    const id = await requireCartId();
    const session = await getClient().carts.paymentSessions.create(
      id,
      {
        payment_method_id: paymentMethodId,
        ...(externalData && { external_data: externalData }),
      },
      options,
    );
    updateTag("checkout");
    return { session };
  }, "Failed to create payment session");
}

/**
 * Creates a direct payment for non-session payment methods
 * (e.g. Check, Cash on Delivery, Bank Transfer).
 */
export async function createDirectPayment(
  cartId: string,
  paymentMethodId: string,
) {
  return actionResult(async () => {
    const options = await getCartOptions();
    const id = await requireCartId();
    const payment = await getClient().carts.payments.create(
      id,
      { payment_method_id: paymentMethodId },
      options,
    );
    updateTag("checkout");
    return { payment };
  }, "Failed to create payment");
}

export async function completeCheckoutPaymentSession(
  cartId: string,
  sessionId: string,
  params?: { session_result?: string; external_data?: Record<string, unknown> },
) {
  return actionResult(async () => {
    const options = await getCartOptions();
    const id = await requireCartId();
    const session = await getClient().carts.paymentSessions.complete(
      id,
      sessionId,
      params,
      options,
    );
    updateTag("checkout");
    return { session };
  }, "Failed to complete payment session");
}

/**
 * Completes the order. Treats 403 and 422 as success:
 * - 403 = cart already completed (e.g. webhook handler completed it)
 * - 422 = state_lock_version conflict (concurrent request)
 *
 * When the order was already completed (403/422), fetch it from the API
 * so the caller always gets the order data for caching on the thank-you page.
 */
export async function completeCheckoutOrder(cartId: string) {
  try {
    const options = await getCartOptions();
    const order: Order = await getClient().carts.complete(cartId, options);
    updateTag("checkout");
    updateTag("cart");
    return { success: true as const, order };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      if (status === 403 || status === 422) {
        // Order already completed — try to fetch it so the thank-you page
        // can cache and display it without a second round-trip.
        const completedOrder = await getOrder(cartId).catch(() => null);
        updateTag("checkout");
        updateTag("cart");
        return { success: true as const, order: completedOrder };
      }
    }
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to complete order",
    };
  }
}

/**
 * Confirms payment and completes the order after returning from an offsite
 * payment gateway (e.g. CashApp, 3D Secure).
 */
export async function confirmPaymentAndCompleteCart(
  cartId: string,
  sessionId?: string,
  sessionResult?: string,
  redirectResult?: string,
  adyenSessionId?: string,
): Promise<
  { success: true; order: unknown } | { success: false; error: string }
> {
  try {
    // Use explicit cartId — cookies may have been cleared during offsite redirect
    const cart = await getCart(cartId);
    if (!cart) {
      // Cart not found — the order may already be completed (e.g. by webhook).
      // Try fetching it as a completed order before giving up.
      const completedOrder = await getOrder(cartId).catch(() => null);
      return { success: true, order: completedOrder };
    }

    if (cart.current_step === "complete") {
      return { success: true, order: cart };
    }

    if (sessionId) {
      const options = await getCartOptions();
      const id = await requireCartId();
      const completeResult = await getClient().carts.paymentSessions.complete(
        id,
        sessionId,
        sessionResult ? { session_result: sessionResult } : undefined,
        options,
      );
      if (completeResult.status === "failed") {
        return {
          success: false,
          error: "Payment was not successful. Please try again.",
        };
      }
    } else if (redirectResult) {
      // Adyen redirect flow: redirectResult is appended by Adyen to the return URL.
      // Pass it to the backend which resolves the session and processes the redirect.
      const options = await getCartOptions();
      const id = await requireCartId();
      const completeResult = await getClient().carts.paymentSessions.complete(
        id,
        adyenSessionId ?? "",
        {
          external_data: {
            redirect_result: redirectResult,
          },
        },
        options,
      );
      if (completeResult.status === "failed") {
        return {
          success: false,
          error: "Payment was not successful. Please try again.",
        };
      }
    }

    const result = await completeCheckoutOrder(cartId);
    if (result.success) {
      return { success: true, order: result.order };
    }
    return { success: false, error: result.error };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to confirm payment. Please try again.",
    };
  }
}
