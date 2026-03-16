"use server";

import {
  complete,
  completePaymentSession,
  createPaymentSession,
  getCart,
} from "@spree/next";
import { actionResult } from "./utils";

export async function createCheckoutPaymentSession(
  cartId: string,
  paymentMethodId: string,
  stripePaymentMethodId?: string,
) {
  return actionResult(async () => {
    const session = await createPaymentSession({
      payment_method_id: paymentMethodId,
      ...(stripePaymentMethodId && {
        external_data: { stripe_payment_method_id: stripePaymentMethodId },
      }),
    });
    return { session };
  }, "Failed to create payment session");
}

export async function completeCheckoutPaymentSession(
  cartId: string,
  sessionId: string,
) {
  return actionResult(async () => {
    const session = await completePaymentSession(sessionId);
    return { session };
  }, "Failed to complete payment session");
}

/**
 * Completes the order. Treats 403 and 422 as success:
 * - 403 = cart already completed (e.g. webhook handler completed it)
 * - 422 = state_lock_version conflict (concurrent request)
 */
export async function completeCheckoutOrder(cartId: string) {
  try {
    const order = await complete(cartId);
    return { success: true as const, order };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error) {
      const status = (error as { status: number }).status;
      if (status === 403 || status === 422) {
        return { success: true as const, order: null };
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
 *
 * Flow: getCart(cartId) → completePaymentSession → completeCheckoutOrder
 */
export async function confirmPaymentAndCompleteCart(
  cartId: string,
  sessionId?: string,
): Promise<
  { success: true; order: unknown } | { success: false; error: string }
> {
  try {
    // Use explicit cartId — cookies may have been cleared during offsite redirect
    const cart = await getCart(cartId);
    if (!cart) {
      return { success: true, order: null };
    }

    if (cart.current_step === "complete") {
      return { success: true, order: cart };
    }

    if (sessionId) {
      const sessionResult = await completePaymentSession(sessionId);
      if (sessionResult.status === "failed") {
        return {
          success: false,
          error: "Payment was not successful. Please try again.",
        };
      }
    }

    // Complete the order — if the backend already completed it during
    // session completion, completeCheckoutOrder handles 403/422 gracefully.
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
