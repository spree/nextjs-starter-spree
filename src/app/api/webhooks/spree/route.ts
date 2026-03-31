import { createWebhookHandler } from "@spree/next/webhooks";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  handleOrderCanceled,
  handleOrderCompleted,
  handleOrderShipped,
  handlePasswordReset,
} from "@/lib/webhooks/handlers";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.SPREE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook endpoint not configured" },
      { status: 503 },
    );
  }

  const handler = createWebhookHandler({
    secret: webhookSecret,
    handlers: {
      "order.completed": handleOrderCompleted,
      "order.canceled": handleOrderCanceled,
      "order.shipped": handleOrderShipped,
      "customer.password_reset_requested": handlePasswordReset,
    },
  });

  return handler(request);
}
