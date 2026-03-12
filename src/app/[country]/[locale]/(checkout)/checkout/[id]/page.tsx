"use client";

import type {
  Address,
  AddressParams,
  Cart,
  Country,
  Shipment,
} from "@spree/sdk";
import { CircleAlert } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { AddressStep } from "@/components/checkout/AddressStep";
import { CouponCode } from "@/components/checkout/CouponCode";
import { DeliveryStep } from "@/components/checkout/DeliveryStep";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { PaymentStep } from "@/components/checkout/PaymentStep";
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
  nextCheckoutStep,
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

const CHECKOUT_STEPS = [
  { id: "address", label: "Shipping" },
  { id: "delivery", label: "Delivery" },
  { id: "payment", label: "Payment" },
];

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
    promotionId: string,
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
  // use() must be called before all other hooks to avoid hook order issues
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
  const [currentStep, setCurrentStep] = useState<string>("address");

  // Use ref to store the current order for stable callback references
  const orderRef = useRef(order);
  orderRef.current = order;

  // Guard to fire begin_checkout only once
  const beginCheckoutFiredRef = useRef(false);

  // Handle coupon code application - uses ref to avoid stale closures
  const handleApplyCoupon = useCallback(async (code: string) => {
    const currentOrder = orderRef.current;
    if (!currentOrder) return { success: false, error: "No order" };

    const result = await applyCouponCode(currentOrder.id, code);
    if (result.success && result.order) {
      setOrder(result.order);
    }
    return result;
  }, []); // No dependencies - uses ref

  // Handle coupon code removal
  const handleRemoveCoupon = useCallback(async (promotionId: string) => {
    const currentOrder = orderRef.current;
    if (!currentOrder) return { success: false, error: "No order" };

    const result = await removeCouponCode(currentOrder.id, promotionId);
    if (result.success && result.order) {
      setOrder(result.order);
    }
    return result;
  }, []); // No dependencies - uses ref

  // Track order key for sidebar updates (only update when order changes meaningfully)
  const orderKey = order ? `${order.id}-${order.updated_at}` : null;
  const prevOrderKeyRef = useRef(orderKey);

  // Update sidebar content when order changes meaningfully
  useEffect(() => {
    // Skip if order key hasn't changed
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

      // Fetch countries scoped to the resolved market
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

      // Check if order is already complete
      if (orderData.current_step === "complete") {
        router.push(`${basePath}/order-placed/${orderId}`);
        return;
      }

      setOrder(orderData);
      setCountries(countriesData.data);
      setSavedAddresses(addressesData.data);
      setIsAuthenticated(authStatus);
      setCurrentStep(orderData.current_step);

      if (!beginCheckoutFiredRef.current) {
        try {
          trackBeginCheckout(orderData);
        } catch {
          // Analytics should never break checkout flow
        }
        beginCheckoutFiredRef.current = true;
      }

      // Set shipments from order data (already included via getCheckoutOrder)
      if (orderData.completed_steps.includes("address")) {
        setShipments(orderData.shipments || []);
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

  // Handle address submission (shipping address only)
  const handleAddressSubmit = async (addressData: {
    email: string;
    ship_address?: AddressParams;
    ship_address_id?: string;
  }) => {
    if (!order) return;

    setProcessing(true);
    setError(null);

    try {
      // Update order with shipping address and email
      const updateResult = await updateOrderAddresses(order.id, {
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
        setProcessing(false);
        return;
      }

      // Move to next checkout step
      const nextResult = await nextCheckoutStep(order.id);
      if (!nextResult.success) {
        setError(nextResult.error || "Failed to proceed to next step");
        setProcessing(false);
        return;
      }

      // Reload order to get updated state
      await loadOrder();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // Handle shipping rate selection
  const handleShippingRateSelect = async (
    shipmentId: string,
    rateId: string,
  ) => {
    if (!order) return;

    setProcessing(true);
    setError(null);

    let trackingOrder: Cart | null = null;
    let trackingRateName: string | undefined;

    try {
      const result = await selectShippingRate(order.id, shipmentId, rateId);
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
  };

  // Handle delivery confirmation (advance to payment step)
  const handleDeliveryConfirm = async () => {
    if (!order) return;

    setProcessing(true);
    setError(null);

    try {
      // Move to next checkout step
      const nextResult = await nextCheckoutStep(order.id);
      if (!nextResult.success) {
        setError(nextResult.error || "Failed to proceed");
        setProcessing(false);
        return;
      }

      // Reload order
      await loadOrder();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // Handle billing address update (called by PaymentStep before gateway confirmation)
  const handleUpdateBillingAddress = async (data: {
    bill_address: AddressParams;
  }): Promise<boolean> => {
    if (!order) return false;

    setError(null);

    try {
      const updateResult = await updateOrderAddresses(order.id, {
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
  };

  // Handle payment completion (called by PaymentStep after Stripe confirms)
  const handlePaymentComplete = async (paymentSessionId: string) => {
    if (!order) return;

    setError(null);

    try {
      // Complete the payment session on the backend
      const sessionResult = await completeCheckoutPaymentSession(
        order.id,
        paymentSessionId,
      );

      if (!sessionResult.success) {
        setError(sessionResult.error || "Failed to complete payment session");
        setProcessing(false);
        return;
      }

      try {
        trackAddPaymentInfo(order);
      } catch {
        // Analytics should never break checkout flow
      }

      // Check if the order was already completed by the payment session completion.
      // If not, explicitly complete it.
      const updatedOrder = await getCheckoutOrder(order.id);

      if (!updatedOrder) {
        setError("Order not found after payment. Please contact support.");
        setProcessing(false);
        return;
      }

      if (updatedOrder.current_step !== "complete") {
        const completeResult = await completeCheckoutOrder(order.id);
        if (!completeResult.success) {
          setError(completeResult.error || "Failed to complete order");
          setProcessing(false);
          return;
        }
      }

      // Redirect to order placed page (cart cookie is cleared there)
      router.push(`${basePath}/order-placed/${order.id}`);
    } catch {
      setError("An error occurred. Please try again.");
      setProcessing(false);
    }
  };

  // Fetch states for a country
  const fetchStates = async (countryIso: string) => {
    try {
      const country = await getCountry(countryIso);
      return country.states || [];
    } catch {
      return [];
    }
  };

  // Update a saved address
  const handleUpdateSavedAddress = async (
    id: string,
    data: AddressParams,
  ): Promise<Address> => {
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
  };

  // Navigate back to a previous step
  const goToStep = (step: string) => {
    setCurrentStep(step);
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

  // Error state
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

  // Check if order has items
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

  const steps = CHECKOUT_STEPS;
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const previousStepId =
    currentStepIndex > 0 ? steps[currentStepIndex - 1].id : undefined;

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
      </div>

      {/* Step indicator */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {steps.map((step, index) => (
              <li
                key={step.id}
                className={`relative flex flex-row items-center ${index === steps.length - 1 ? "w-auto" : "w-full"}`}
              >
                <div className="flex items-center pr-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                      index < currentStepIndex
                        ? "bg-black text-white"
                        : index === currentStepIndex
                          ? "bg-primary text-white"
                          : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {index < currentStepIndex ? "✓" : index + 1}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      index === currentStepIndex
                        ? "text-primary"
                        : index < currentStepIndex
                          ? "text-gray-900"
                          : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-full h-0.5 bg-gray-200">
                    <div
                      className={`h-full ${index < currentStepIndex ? "bg-primary" : "bg-gray-200"}`}
                      style={{
                        width: index < currentStepIndex ? "100%" : "0%",
                      }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Error banner */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <CircleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main content */}
      {currentStep === "address" && (
        <AddressStep
          order={order}
          countries={countries}
          savedAddresses={savedAddresses}
          isAuthenticated={isAuthenticated}
          signInUrl={`${basePath}/account?redirect=${encodeURIComponent(pathname)}`}
          fetchStates={fetchStates}
          onSubmit={handleAddressSubmit}
          onUpdateSavedAddress={
            isAuthenticated ? handleUpdateSavedAddress : undefined
          }
          processing={processing}
        />
      )}

      {currentStep === "delivery" && (
        <DeliveryStep
          order={order}
          shipments={shipments}
          onShippingRateSelect={handleShippingRateSelect}
          onConfirm={handleDeliveryConfirm}
          onBack={previousStepId ? () => goToStep(previousStepId) : undefined}
          processing={processing}
        />
      )}

      {currentStep === "payment" && (
        <PaymentStep
          order={order}
          countries={countries}
          isAuthenticated={isAuthenticated}
          fetchStates={fetchStates}
          onUpdateBillingAddress={handleUpdateBillingAddress}
          onPaymentComplete={handlePaymentComplete}
          onBack={previousStepId ? () => goToStep(previousStepId) : undefined}
          processing={processing}
          setProcessing={setProcessing}
        />
      )}
    </>
  );
}
