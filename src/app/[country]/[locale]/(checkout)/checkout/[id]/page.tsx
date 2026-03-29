"use client";

import type { Address, AddressParams, Cart, Country } from "@spree/sdk";
import { CircleAlert, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { AddressSection } from "@/components/checkout/AddressSection";
import { CouponCode } from "@/components/checkout/CouponCode";
import { DeliveryMethodSection } from "@/components/checkout/DeliveryMethodSection";
import {
  PaymentSection,
  type PaymentSectionHandle,
} from "@/components/checkout/PaymentSection";
import { Summary } from "@/components/checkout/Summary";
import { useAuth } from "@/contexts/AuthContext";
import { useCheckout } from "@/contexts/CheckoutContext";
import {
  trackAddPaymentInfo,
  trackAddShippingInfo,
  trackBeginCheckout,
} from "@/lib/analytics/gtm";
import { getAddresses, updateAddress } from "@/lib/data/addresses";
import {
  applyCode,
  getCheckoutOrder,
  removeDiscountCode,
  removeGiftCard,
  selectDeliveryRate,
  updateOrderAddresses,
} from "@/lib/data/checkout";
import { isAuthenticated as checkAuth } from "@/lib/data/cookies";
import { getCountry } from "@/lib/data/countries";
import { getMarketCountries, resolveMarket } from "@/lib/data/markets";
import {
  completeCheckoutOrder,
  completeCheckoutPaymentSession,
} from "@/lib/data/payment";
import { extractBasePath } from "@/lib/utils/path";

interface CheckoutPageProps {
  params: Promise<{
    id: string;
    country: string;
    locale: string;
  }>;
}

// Sidebar summary component
function CheckoutSidebar({
  cart,
  onApplyCode,
  onRemoveDiscount,
  onRemoveGiftCard,
}: {
  cart: Cart;
  onApplyCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  onRemoveDiscount: (
    code: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onRemoveGiftCard: (
    giftCardId: string,
  ) => Promise<{ success: boolean; error?: string }>;
}) {
  return (
    <>
      <Summary cart={cart} />
      <div className="mt-6 pt-6 border-t border-gray-200">
        <CouponCode
          cart={cart}
          onApply={onApplyCode}
          onRemoveDiscount={onRemoveDiscount}
          onRemoveGiftCard={onRemoveGiftCard}
        />
      </div>
    </>
  );
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const { id: cartId, country: urlCountry } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const basePath = extractBasePath(pathname);
  const { setSummaryContent } = useCheckout();
  const { user, loading: authLoading } = useAuth();

  // Pick up payment errors from the confirm-payment redirect
  const paymentError = searchParams.get("payment_error");

  const [cart, setCart] = useState<Cart | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(paymentError);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sectionErrors, setSectionErrors] = useState<Record<string, string[]>>(
    {},
  );

  const fulfillments = cart?.fulfillments ?? [];

  const cartRef = useRef(cart);
  cartRef.current = cart;
  const beginCheckoutFiredRef = useRef(false);
  const paymentRef = useRef<PaymentSectionHandle>(null);

  // Handle code application (discount code or gift card — single input field)
  const handleApplyCode = useCallback(async (code: string) => {
    const currentOrder = cartRef.current;
    if (!currentOrder) return { success: false, error: "No cart" };

    const result = await applyCode(currentOrder.id, code);
    if (result.success && result.cart) {
      setCart(result.cart);
    }
    return result;
  }, []);

  const handleRemoveDiscount = useCallback(async (discountCode: string) => {
    const currentOrder = cartRef.current;
    if (!currentOrder) return { success: false, error: "No cart" };

    const result = await removeDiscountCode(currentOrder.id, discountCode);
    if (result.success && result.cart) {
      setCart(result.cart);
    }
    return result;
  }, []);

  const handleRemoveGiftCard = useCallback(async (giftCardId: string) => {
    const currentOrder = cartRef.current;
    if (!currentOrder) return { success: false, error: "No cart" };

    const result = await removeGiftCard(currentOrder.id, giftCardId);
    if (result.success && result.cart) {
      setCart(result.cart);
    }
    return result;
  }, []);

  // Track cart key for sidebar updates
  const cartKey = cart
    ? `${cart.id}-${cart.total}-${cart.total_quantity}`
    : null;
  const prevOrderKeyRef = useRef(cartKey);

  useEffect(() => {
    if (
      cartKey === prevOrderKeyRef.current &&
      prevOrderKeyRef.current !== null
    ) {
      return;
    }
    prevOrderKeyRef.current = cartKey;

    if (cart) {
      setSummaryContent(
        <CheckoutSidebar
          cart={cart}
          onApplyCode={handleApplyCode}
          onRemoveDiscount={handleRemoveDiscount}
          onRemoveGiftCard={handleRemoveGiftCard}
        />,
      );
    } else {
      setSummaryContent(null);
    }
  }, [
    cart,
    cartKey,
    setSummaryContent,
    handleApplyCode,
    handleRemoveDiscount,
    handleRemoveGiftCard,
  ]);

  // Load cart and market-scoped countries
  const loadOrder = useCallback(async () => {
    setLoading(true);
    if (!paymentError) setError(null);

    try {
      const [cartData, market, addressesData, authStatus] = await Promise.all([
        getCheckoutOrder(cartId),
        resolveMarket(urlCountry).catch(() => null),
        getAddresses(),
        checkAuth(),
      ]);

      const countriesData = market
        ? await getMarketCountries(market.id).catch(() => ({
            data: [] as Country[],
          }))
        : { data: [] as Country[] };

      if (!cartData) {
        setError("Order not found or you don't have access to it.");
        setLoading(false);
        return;
      }

      if (cartData.current_step === "complete") {
        router.push(`${basePath}/order-placed/${cartId}`);
        return;
      }

      setCart(cartData);
      setCountries(countriesData.data);
      setSavedAddresses(addressesData.data);
      setIsAuthenticated(authStatus);

      if (!beginCheckoutFiredRef.current) {
        try {
          trackBeginCheckout(cartData);
        } catch {
          // Analytics should never break checkout flow
        }
        beginCheckoutFiredRef.current = true;
      }

      return cartData;
    } catch {
      setError("Failed to load checkout. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [cartId, urlCountry, basePath, router, paymentError]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Handle email blur — persist email as the first backend call
  const handleEmailBlur = useCallback(async (email: string) => {
    const currentOrder = cartRef.current;
    if (!currentOrder || !email.trim()) return;

    // Only persist email if it changed
    if (email === currentOrder.email) return;

    try {
      const result = await updateOrderAddresses(currentOrder.id, { email });
      if (result.success && result.cart) {
        setCart(result.cart);
      }
    } catch {
      // Email save failure is not critical — will be caught on "Pay now"
    }
  }, []);

  // Handle auto-save (address + email on blur)
  const handleAutoSave = useCallback(
    async (addressData: {
      email: string;
      shipping_address?: AddressParams;
      shipping_address_id?: string;
    }) => {
      const currentOrder = cartRef.current;
      if (!currentOrder) return;

      setSaving(true);
      setError(null);

      try {
        const updateResult = await updateOrderAddresses(currentOrder.id, {
          email: addressData.email,
          ...(addressData.shipping_address && {
            shipping_address: addressData.shipping_address,
          }),
          ...(addressData.shipping_address_id && {
            shipping_address_id: addressData.shipping_address_id,
          }),
        });

        if (!updateResult.success) {
          setError(updateResult.error || "Failed to save address");
          return;
        }

        if (updateResult.cart) {
          setCart(updateResult.cart);
        }
      } catch {
        setError("An error occurred. Please try again.");
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  // Handle delivery rate selection
  const handleDeliveryRateSelect = useCallback(
    async (fulfillmentId: string, rateId: string) => {
      const currentOrder = cartRef.current;
      if (!currentOrder) return;

      setProcessing(true);
      setError(null);

      let trackingOrder: Cart | null = null;
      let trackingRateName: string | undefined;

      try {
        const result = await selectDeliveryRate(
          currentOrder.id,
          fulfillmentId,
          rateId,
        );
        if (!result.success) {
          setError(result.error || "Failed to select delivery rate");
        } else if (result.cart) {
          setCart(result.cart);

          const selectedRate = result.cart.fulfillments
            ?.flatMap((s) => s.delivery_rates || [])
            ?.find((r) => r.id === rateId);
          trackingOrder = result.cart;
          trackingRateName = selectedRate?.name;
        }
      } catch {
        setError("An error occurred. Please try again.");
      } finally {
        setProcessing(false);
      }

      if (trackingOrder) {
        try {
          trackAddShippingInfo(trackingOrder, trackingRateName);
        } catch {
          // Analytics should never break checkout flow
        }
      }
    },
    [],
  );

  // Handle billing address update (called by PaymentSection before gateway confirmation)
  const handleUpdateBillingAddress = useCallback(
    async (data: {
      billing_address?: AddressParams;
      use_shipping?: boolean;
    }): Promise<boolean> => {
      const currentOrder = cartRef.current;
      if (!currentOrder) return false;

      setError(null);

      try {
        const updateResult = await updateOrderAddresses(currentOrder.id, {
          ...(data.billing_address && {
            billing_address: data.billing_address,
          }),
          ...(data.use_shipping && { use_shipping: data.use_shipping }),
        });

        if (!updateResult.success) {
          setError(updateResult.error || "Failed to save billing address");
          return false;
        }

        return true;
      } catch {
        setError("Failed to save billing address. Please try again.");
        return false;
      }
    },
    [],
  );

  // Handle payment completion (called by PaymentSection after Stripe confirms)
  const handlePaymentComplete = useCallback(
    async (paymentSessionId: string) => {
      const currentOrder = cartRef.current;
      if (!currentOrder) return;

      setError(null);

      try {
        const sessionResult = await completeCheckoutPaymentSession(
          currentOrder.id,
          paymentSessionId,
        );

        if (!sessionResult.success) {
          setError(sessionResult.error || "Failed to complete payment session");
          setProcessing(false);
          return;
        }

        try {
          trackAddPaymentInfo(currentOrder);
        } catch {
          // Analytics should never break checkout flow
        }

        // Complete the order — if the backend already completed it during
        // session completion, completeCheckoutOrder handles 403/422 gracefully.
        const completeResult = await completeCheckoutOrder(currentOrder.id);
        if (!completeResult.success) {
          setError(completeResult.error || "Failed to complete order");
          setProcessing(false);
          return;
        }

        // Cache the completed order for the thank-you page
        if (completeResult.order) {
          const { cacheCompletedOrder } = await import(
            "@/lib/utils/completed-order-cache"
          );
          cacheCompletedOrder(currentOrder.id, completeResult.order);
        }

        router.push(`${basePath}/order-placed/${currentOrder.id}`);
      } catch {
        setError("An error occurred. Please try again.");
        setProcessing(false);
      }
    },
    [basePath, router],
  );

  // Fetch states for a country
  const fetchStates = useCallback(async (countryIso: string) => {
    try {
      const country = await getCountry(countryIso);
      return country.states || [];
    } catch {
      return [];
    }
  }, []);

  // Update a saved address
  const handleUpdateSavedAddress = useCallback(
    async (id: string, data: AddressParams): Promise<Address> => {
      const result = await updateAddress(id, data);

      if (!result.success) {
        throw new Error(result.error || "Failed to update address");
      }

      if (!result.address) {
        throw new Error("Update succeeded but address payload is missing");
      }

      return result.address;
    },
    [],
  );

  // Validate and pay — single "Pay now" action
  const validateAndPay = async () => {
    if (!cart) return;

    setSectionErrors({});
    setError(null);

    // Refresh cart to get latest requirements
    const freshOrder = await getCheckoutOrder(cart.id);
    if (!freshOrder) {
      setError("Failed to load cart. Please try again.");
      return;
    }
    setCart(freshOrder);

    // Check requirements — skip "payment" since we handle that via
    // the PaymentSection imperative submit (payment is created at confirmation time)
    const prePaymentReqs = (freshOrder.requirements || []).filter(
      (req) => req.step !== "payment",
    );

    if (prePaymentReqs.length > 0) {
      const errorsBySection: Record<string, string[]> = {};

      for (const req of prePaymentReqs) {
        // Map requirement steps to section IDs
        const sectionId =
          req.step === "address"
            ? "address"
            : req.step === "delivery"
              ? "shipping"
              : req.step;
        if (!errorsBySection[sectionId]) {
          errorsBySection[sectionId] = [];
        }
        errorsBySection[sectionId].push(req.message);
      }

      setSectionErrors(errorsBySection);

      // Scroll to first error section
      const firstSection = Object.keys(errorsBySection)[0];
      const el = document.getElementById(`checkout-section-${firstSection}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      return;
    }

    // All requirements met — submit payment
    if (!paymentRef.current) {
      setError("Payment is not ready. Please wait and try again.");
      return;
    }

    setProcessing(true);
    await paymentRef.current.submit();
    // PaymentSection handles setProcessing(false) on error internally
  };

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="space-y-4 mt-8">
          <div className="h-12 bg-gray-200 rounded" />
          <div className="h-12 bg-gray-200 rounded" />
          <div className="h-12 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // Error state (no cart loaded)
  if (error && !cart) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Checkout Error
        </h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link
          href={`${basePath}/cart`}
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-700"
        >
          Return to Cart
        </Link>
      </div>
    );
  }

  if (!cart) return null;

  // Empty cart
  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Your Cart is Empty
        </h1>
        <p className="text-gray-600 mb-6">
          Add some items to your cart before checking out.
        </p>
        <Link
          href={`${basePath}/products`}
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-700"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Error banner */}
      {error && (
        <div className="rounded-sm border border-red-300 bg-red-50 px-4 py-3 mb-6">
          <p className="text-sm text-red-700 flex items-center gap-2">
            <CircleAlert className="h-4 w-4 flex-shrink-0" />
            {error}
          </p>
        </div>
      )}

      {/* Contact + Delivery */}
      <div id="checkout-section-address">
        <AddressSection
          cart={cart}
          countries={countries}
          savedAddresses={savedAddresses}
          isAuthenticated={isAuthenticated}
          signInUrl={`${basePath}/account?redirect=${encodeURIComponent(pathname)}`}
          fetchStates={fetchStates}
          onEmailBlur={handleEmailBlur}
          onAutoSave={handleAutoSave}
          onUpdateSavedAddress={
            isAuthenticated ? handleUpdateSavedAddress : undefined
          }
          errors={sectionErrors.address}
          saving={saving}
          processing={processing}
          user={user}
        />
      </div>

      {/* Shipping method */}
      <div id="checkout-section-shipping" className="mt-6">
        <DeliveryMethodSection
          fulfillments={fulfillments}
          onDeliveryRateSelect={handleDeliveryRateSelect}
          processing={processing}
          errors={sectionErrors.shipping}
        />
      </div>

      {/* Payment */}
      <div id="checkout-section-payment" className="mt-6">
        <PaymentSection
          ref={paymentRef}
          cart={cart}
          countries={countries}
          isAuthenticated={isAuthenticated}
          fetchStates={fetchStates}
          onUpdateBillingAddress={handleUpdateBillingAddress}
          onPaymentComplete={handlePaymentComplete}
          processing={processing}
          setProcessing={setProcessing}
          errors={sectionErrors.payment}
        />
      </div>

      {/* Pay now button — Shopify: black, tall, minimal radius, bold */}
      <button
        type="button"
        onClick={validateAndPay}
        disabled={processing}
        className="w-full mt-8 h-[54px] bg-black text-white text-sm font-bold rounded-sm hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Pay now"
        )}
      </button>
    </div>
  );
}
