/**
 * Payment Gateway Registry
 *
 * Maps Spree payment method `type` strings to dynamically-imported
 * gateway components. Each gateway is code-split so its SDK only
 * loads when the corresponding payment method is active.
 *
 * To add a new gateway:
 *   1. Create a component under `gateways/<name>/` implementing PaymentGatewayProps + PaymentGatewayHandle
 *   2. Register it below with the payment method type from your Spree API
 *   3. Export default the component as a forwardRef
 */

import { lazy } from "react";
import type { PaymentGatewayHandle, PaymentGatewayProps } from "./types";

type GatewayComponent = React.ForwardRefExoticComponent<
  PaymentGatewayProps & React.RefAttributes<PaymentGatewayHandle>
>;

type GatewayLoader = () => Promise<{ default: GatewayComponent }>;

const registry = new Map<string, GatewayLoader>();

// --- Register gateways here ---

registry.set("SpreeStripe::Gateway", () => import("./stripe/StripeGateway"));

// Example: Adyen
// registry.set("SpreeAdyen::Gateway", () => import("./adyen/AdyenGateway"));

// --- End registry ---

// Cache lazy components so the same type always returns the same reference.
// Without this, React.lazy() creates a new component type on every call,
// causing remounts and losing refs/state.
const componentCache = new Map<string, GatewayComponent>();

export function getGatewayComponent(type: string): GatewayComponent | null {
  const cached = componentCache.get(type);
  if (cached) return cached;

  const loader = registry.get(type);
  if (!loader) return null;

  const component = lazy(loader);
  componentCache.set(type, component);
  return component;
}

export function hasGateway(type: string): boolean {
  return registry.has(type);
}
