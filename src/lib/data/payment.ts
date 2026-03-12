"use server";

import {
  complete,
  completePaymentSession,
  createPaymentSession,
} from "@spree/next";
import { actionResult } from "./utils";

export async function createCheckoutPaymentSession(
  _orderId: string,
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
  _orderId: string,
  sessionId: string,
) {
  return actionResult(async () => {
    const session = await completePaymentSession(sessionId);
    return { session };
  }, "Failed to complete payment session");
}

export async function completeCheckoutOrder(_orderId: string) {
  return actionResult(async () => {
    const order = await complete();
    return { order };
  }, "Failed to complete order");
}
