"use client";

import type {
  Address,
  AddressParams,
  Cart,
  Country,
  Shipment,
} from "@spree/sdk";
import { CircleAlert, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { AddressSection } from "@/components/checkout/AddressSection";
import { CouponCode } from "@/components/checkout/CouponCode";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import {
  PaymentSection,
  type PaymentSectionHandle,
} from "@/components/checkout/PaymentSection";
import { ShippingMethodSection } from "@/components/checkout/ShippingMethodSection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCheckout } from "@/contexts/CheckoutContext";
import {
  trackAddPaymentInfo,
  trackAddShippingInfo,
  trackBeginCheckout,
} from "@/lib/analytics/gtm";
import { getAddresses, updateAddress } from "@/lib/data/addresses";
import {
  applyCouponCode,
  getCheckoutOrder,
  removeCouponCode,
  selectShippingRate,
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
  order,
  onApplyCoupon,
  onRemoveCoupon,
}: {
  order: Cart;
  onApplyCoupon: (
    code: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onRemoveCoupon: (
    code: string,
  ) => Promise<{ success: boolean; error?: string }>;
}) {
  return (
    <>
      <OrderSummary order={order} />
      <div className="mt-6 pt-6 border-t border-gray-200">
        <CouponCode
          order={order}
          onApply={onApplyCoupon}
          onRemove={onRemoveCoupon}
        />
      </div>
    </>
  );
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const { id: orderId, country: urlCountry } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  const { setSummaryContent } = useCheckout();

  const [order, setOrder] = useState<Cart | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sectionErrors, setSectionErrors] = useState<Record<string, string[]>>(
    {},
  );

  const orderRef = useRef(order);
  orderRef.current = order;
  const beginCheckoutFiredRef = useRef(false);
  const paymentRef = useRef<PaymentSectionHandle>(null);

  // Handle coupon code application
  const handleApplyCoupon = useCallback(async (code: string) => {
    const currentOrder = orderRef.current;
    if (!currentOrder) return { success: false, error: "No order" };

    const result = await applyCouponCode(currentOrder.id, code);
    if (result.success && result.order) {
      setOrder(result.order);
    }
    return result;
  }, []);

  const handleRemoveCoupon = useCallback(async (couponCode: string) => {
    const currentOrder = orderRef.current;
    if (!currentOrder) return { success: false, error: "No order" };

    const result = await removeCouponCode(currentOrder.id, couponCode);
    if (result.success && result.order) {
      setOrder(result.order);
    }
    return result;
  }, []);

  // Track order key for sidebar updates
  const orderKey = order ? `${order.id}-${order.updated_at}` : null;
  const prevOrderKeyRef = useRef(orderKey);

  useEffect(() => {
    if (
      orderKey === prevOrderKeyRef.current &&
      prevOrderKeyRef.current !== null
    ) {
      return;
    }
    prevOrderKeyRef.current = orderKey;

    if (order) {
      setSummaryContent(
        <CheckoutSidebar
          order={order}
          onApplyCoupon={handleApplyCoupon}
          onRemoveCoupon={handleRemoveCoupon}
        />,
      );
    } else {
      setSummaryContent(null);
    }
  }, [
    order,
    orderKey,
    setSummaryContent,
    handleApplyCoupon,
    handleRemoveCoupon,
  ]);

  // Load order and market-scoped countries
  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [orderData, market, addressesData, authStatus] = await Promise.all([
        getCheckoutOrder(orderId),
        resolveMarket(urlCountry).catch(() => null),
        getAddresses(),
        checkAuth(),
      ]);

      const countriesData = market
        ? await getMarketCountries(market.id).catch(() => ({
            data: [] as Country[],
          }))
        : { data: [] as Country[] };

      if (!orderData) {
        setError("Order not found or you don't have access to it.");
        setLoading(false);
        return;
      }

      if (orderData.current_step === "complete") {
        router.push(`${basePath}/order-placed/${orderId}`);
        return;
      }

      setOrder(orderData);
      setCountries(countriesData.data);
      setSavedAddresses(addressesData.data);
      setIsAuthenticated(authStatus);
      setShipments(orderData.shipments || []);

      if (!beginCheckoutFiredRef.current) {
        try {
          trackBeginCheckout(orderData);
        } catch {
          // Analytics should never break checkout flow
        }
        beginCheckoutFiredRef.current = true;
      }

      // If the order already has an address + email but no shipments,
      // re-submit to push the backend state machine forward and generate shipments.
      if (
        orderData.ship_address &&
        orderData.email &&
        !orderData.shipments?.length
      ) {
        try {
          const result = await updateOrderAddresses(orderData.id, {
            email: orderData.email,
          });
          if (result.success && result.order) {
            setOrder(result.order);
            setShipments(result.order.shipments || []);
          }
        } catch {
          // Non-critical — user can still trigger via address interaction
        }
      }

      return orderData;
    } catch {
      setError("Failed to load checkout. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [orderId, urlCountry, basePath, router]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Handle email blur — persist email as the first backend call
  const handleEmailBlur = useCallback(async (email: string) => {
    const currentOrder = orderRef.current;
    if (!currentOrder || !email.trim()) return;

    // Only persist email if it changed
    if (email === currentOrder.email) return;

    try {
      const result = await updateOrderAddresses(currentOrder.id, { email });
      if (result.success && result.order) {
        setOrder(result.order);
      }
    } catch {
      // Email save failure is not critical — will be caught on "Pay now"
    }
  }, []);

  // Handle auto-save (address + email on blur)
  const handleAutoSave = useCallback(
    async (addressData: {
      email: string;
      ship_address?: AddressParams;
      ship_address_id?: string;
    }) => {
      const currentOrder = orderRef.current;
      if (!currentOrder) return;

      setSaving(true);
      setError(null);

      try {
        const updateResult = await updateOrderAddresses(currentOrder.id, {
          email: addressData.email,
          ...(addressData.ship_address && {
            ship_address: addressData.ship_address,
          }),
          ...(addressData.ship_address_id && {
            ship_address_id: addressData.ship_address_id,
          }),
        });

        if (!updateResult.success) {
          setError(updateResult.error || "Failed to save address");
          return;
        }

        // Reload order to get updated state (auto-advanced by backend)
        const updatedOrder = await getCheckoutOrder(currentOrder.id);
        if (updatedOrder) {
          setOrder(updatedOrder);
          setShipments(updatedOrder.shipments || []);
        }
      } catch {
        setError("An error occurred. Please try again.");
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  // Handle shipping rate selection
  const handleShippingRateSelect = useCallback(
    async (shipmentId: string, rateId: string) => {
      const currentOrder = orderRef.current;
      if (!currentOrder) return;

      setProcessing(true);
      setError(null);

      let trackingOrder: Cart | null = null;
      let trackingRateName: string | undefined;

      try {
        const result = await selectShippingRate(
          currentOrder.id,
          shipmentId,
          rateId,
        );
        if (!result.success) {
          setError(result.error || "Failed to select shipping rate");
        } else if (result.order) {
          setOrder(result.order);
          setShipments(result.order.shipments || []);

          const selectedRate = result.order.shipments
            ?.flatMap((s) => s.shipping_rates || [])
            ?.find((r) => r.id === rateId);
          trackingOrder = result.order;
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
    async (data: { bill_address: AddressParams }): Promise<boolean> => {
      const currentOrder = orderRef.current;
      if (!currentOrder) return false;

      setError(null);

      try {
        const updateResult = await updateOrderAddresses(currentOrder.id, {
          bill_address: data.bill_address,
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
      const currentOrder = orderRef.current;
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

        // The gateway may have already pushed the order to complete during
        // the payment session completion. Try to fetch the order first —
        // if it's no longer found (completed orders aren't returned by
        // getCheckout), skip straight to the thank-you page.
        const updatedOrder = await getCheckoutOrder(currentOrder.id);

        if (updatedOrder && updatedOrder.current_step !== "complete") {
          const completeResult = await completeCheckoutOrder(currentOrder.id);
          if (!completeResult.success) {
            setError(completeResult.error || "Failed to complete order");
            setProcessing(false);
            return;
          }
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

      const updatedAddress = result.address;
      setSavedAddresses((prev) =>
        prev.map((addr) => (addr.id === id ? updatedAddress : addr)),
      );

      return updatedAddress;
    },
    [],
  );

  // Validate and pay — single "Pay now" action
  const validateAndPay = async () => {
    if (!order) return;

    setSectionErrors({});
    setError(null);

    // Refresh order to get latest requirements
    const freshOrder = await getCheckoutOrder(order.id);
    if (!freshOrder) {
      setError("Failed to load order. Please try again.");
      return;
    }
    setOrder(freshOrder);
    setShipments(freshOrder.shipments || []);

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
    const result = await paymentRef.current.submit();
    if (result.error) {
      // Processing is already set to false by PaymentSection on error
    }
  };

  // Loading state
  if (loading) {
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

  // Error state (no order loaded)
  if (error && !order) {
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

  if (!order) return null;

  // Empty cart
  if (!order.items || order.items.length === 0) {
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
        <div className="rounded-[5px] border border-red-300 bg-red-50 px-4 py-3 mb-6">
          <p className="text-sm text-red-700 flex items-center gap-2">
            <CircleAlert className="h-4 w-4 flex-shrink-0" />
            {error}
          </p>
        </div>
      )}

      {/* Contact + Delivery */}
      <div id="checkout-section-address">
        <AddressSection
          order={order}
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
        />
      </div>

      {/* Shipping method */}
      <div id="checkout-section-shipping" className="mt-6">
        <ShippingMethodSection
          shipments={shipments}
          onShippingRateSelect={handleShippingRateSelect}
          processing={processing}
          errors={sectionErrors.shipping}
        />
      </div>

      {/* Payment */}
      <div id="checkout-section-payment" className="mt-6">
        <PaymentSection
          ref={paymentRef}
          order={order}
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
        className="w-full mt-8 h-[54px] bg-black text-white text-sm font-bold rounded-[5px] hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
