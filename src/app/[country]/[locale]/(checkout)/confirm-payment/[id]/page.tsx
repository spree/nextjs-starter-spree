"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { use, useEffect, useRef } from "react";
import { confirmPaymentAndCompleteCart } from "@/lib/data/payment";
import { extractBasePath } from "@/lib/utils/path";

interface ConfirmPaymentPageProps {
  params: Promise<{
    id: string;
    country: string;
    locale: string;
  }>;
}

/**
 * Intermediate page that offsite payment gateways redirect to.
 *
 * When a customer returns from an offsite gateway (e.g. Stripe 3D Secure),
 * the payment webhook may not have arrived yet. This page:
 * 1. Tries to complete the payment session (tells Spree to check with the provider)
 * 2. If successful, completes the order and redirects to order-placed
 * 3. If failed, redirects back to checkout with an error
 */
export default function ConfirmPaymentPage({
  params,
}: ConfirmPaymentPageProps) {
  const { id: cartId } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const basePath = extractBasePath(pathname);
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    const sessionId = searchParams.get("session");

    async function confirmAndRedirect() {
      const result = await confirmPaymentAndCompleteCart(
        cartId,
        sessionId ?? undefined,
      );

      if (result.success) {
        // Cache the completed order for the thank-you page
        if (result.order) {
          const { cacheCompletedOrder } = await import(
            "@/lib/utils/completed-order-cache"
          );
          cacheCompletedOrder(cartId, result.order);
        }

        router.replace(`${basePath}/order-placed/${cartId}`);
      } else {
        const errorMessage = encodeURIComponent(
          result.error || "Payment could not be confirmed. Please try again.",
        );
        router.replace(
          `${basePath}/checkout/${cartId}?payment_error=${errorMessage}`,
        );
      }
    }

    confirmAndRedirect();
  }, [cartId, searchParams, basePath, router]);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      <p className="text-sm text-gray-500">Confirming your payment...</p>
    </div>
  );
}
