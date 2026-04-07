import type { WebhookEvent } from "@spree/sdk/webhooks";
import { verifyWebhookSignature } from "@spree/sdk/webhooks";
import { NextResponse } from "next/server";

export type { WebhookEvent };

export type WebhookHandler<T = any> = (event: WebhookEvent<T>) => Promise<void>;

export interface CreateWebhookHandlerOptions {
  /**
   * The webhook endpoint secret key (from Spree Admin → Webhooks).
   * Usually: `process.env.SPREE_WEBHOOK_SECRET`
   */
  secret: string;

  /**
   * Map of event names to handler functions.
   * Unhandled events return 200 with `{ handled: false }` so Spree doesn't retry.
   */
  handlers: Record<string, WebhookHandler>;

  /**
   * Max age of the webhook timestamp in seconds before rejecting (replay protection).
   * @default 300 (5 minutes)
   */
  toleranceSeconds?: number;

  /**
   * Optional `waitUntil` function for extending serverless execution context.
   * On Vercel/Cloudflare, pass `waitUntil` from the request context to ensure
   * handlers complete even after the response is sent.
   *
   * If not provided, handlers are awaited before returning the response.
   */
  waitUntil?: (promise: Promise<unknown>) => void;
}

/**
 * Creates a Next.js Route Handler for Spree webhooks.
 *
 * Handles signature verification, event parsing, and dispatching to your handlers.
 */
export function createWebhookHandler(options: CreateWebhookHandlerOptions) {
  const { secret, handlers, toleranceSeconds, waitUntil } = options;

  return async function POST(request: Request) {
    if (!secret) {
      console.error("[spree-webhook] Secret is not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    const body = await request.text();
    const signature = request.headers.get("x-spree-webhook-signature");
    const timestamp = request.headers.get("x-spree-webhook-timestamp");
    const eventName = request.headers.get("x-spree-webhook-event");

    if (!signature || !timestamp) {
      return NextResponse.json(
        { error: "Missing signature headers" },
        { status: 401 },
      );
    }

    if (
      !verifyWebhookSignature(
        body,
        signature,
        timestamp,
        secret,
        toleranceSeconds,
      )
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let event: WebhookEvent;
    try {
      event = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const name = eventName || event.name;
    const handler = handlers[name];

    if (!handler) {
      return NextResponse.json({ received: true, handled: false });
    }

    if (waitUntil) {
      // Fire-and-forget with waitUntil — errors are logged but response is immediate
      const work = handler(event).catch((error) => {
        console.error(`[spree-webhook] Error handling ${name}:`, error);
      });
      waitUntil(work);
      return NextResponse.json({ received: true, handled: true });
    }

    try {
      await handler(event);
      return NextResponse.json({ received: true, handled: true });
    } catch (error) {
      console.error(`[spree-webhook] Error handling ${name}:`, error);
      return NextResponse.json({ error: "Handler failed" }, { status: 500 });
    }
  };
}
