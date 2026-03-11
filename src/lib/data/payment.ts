"use server";

import {
  complete,
  completePaymentSession,
  createPayment,
  createPaymentSession,
} from "@spree/next";
import { actionResult } from "./utils";

export async function createCheckoutPaymentSession(
  orderId: string,
  paymentMethodId: string,
  externalData?: Record<string, unknown>,
) {
  return actionResult(async () => {
    const session = await createPaymentSession(orderId, {
      payment_method_id: paymentMethodId,
      ...(externalData && { external_data: externalData }),
    });
    return { session };
  }, "Failed to create payment session");
}

export async function createCheckoutPayment(
  orderId: string,
  paymentMethodId: string,
  metadata?: Record<string, unknown>,
) {
  return actionResult(async () => {
    const payment = await createPayment(orderId, {
      payment_method_id: paymentMethodId,
      ...(metadata && { metadata }),
    });
    return { payment };
  }, "Failed to create payment");
}

export async function completeCheckoutPaymentSession(
  orderId: string,
  sessionId: string,
) {
  return actionResult(async () => {
    const session = await completePaymentSession(orderId, sessionId);
    return { session };
  }, "Failed to complete payment session");
}

export async function completeCheckoutOrder(orderId: string) {
  return actionResult(async () => {
    const order = await complete(orderId);
    return { order };
  }, "Failed to complete order");
}
