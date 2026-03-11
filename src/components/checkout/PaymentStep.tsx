"use client";

import type {
  AddressParams,
  Country,
  Order,
  PaymentMethod,
  PaymentSession,
  State,
} from "@spree/sdk";
import { CircleAlert, CreditCard, Loader2 } from "lucide-react";
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { createCheckoutPaymentSession } from "@/lib/data/payment";
import {
  type AddressFormData,
  addressesMatch,
  addressToFormData,
  formDataToAddress,
} from "@/lib/utils/address";
import { AddressFormFields } from "./AddressFormFields";
import { getGatewayComponent } from "./gateways/registry";
import SimpleConfirmationGateway from "./gateways/SimpleConfirmationGateway";
import type { PaymentGatewayHandle } from "./gateways/types";
import { PaymentMethodSelector } from "./PaymentMethodSelector";

interface PaymentStepProps {
  order: Order;
  countries: Country[];
  isAuthenticated: boolean;
  fetchStates: (countryIso: string) => Promise<State[]>;
  onUpdateBillingAddress: (data: {
    bill_address: AddressParams;
  }) => Promise<boolean>;
  onPaymentComplete: (
    paymentSessionId: string | null,
    paymentMethodId: string,
  ) => Promise<void>;
  onBack?: () => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
}

export function PaymentStep({
  order,
  countries,
  isAuthenticated,
  fetchStates,
  onUpdateBillingAddress,
  onPaymentComplete,
  onBack,
  processing,
  setProcessing,
}: PaymentStepProps) {
  // --- Billing address state ---
  const shipAddressData = addressToFormData(order.ship_address);
  const billAddressData = addressToFormData(order.bill_address);
  const initialUseShipping =
    !order.bill_address || addressesMatch(shipAddressData, order.bill_address);

  const [billAddress, setBillAddress] = useState<AddressFormData>(
    initialUseShipping ? shipAddressData : billAddressData,
  );
  const [useShippingForBilling, setUseShippingForBilling] =
    useState(initialUseShipping);
  const [billStates, setBillStates] = useState<State[]>([]);
  const [isPendingBill, startTransitionBill] = useTransition();

  // --- Payment method selection ---
  const paymentMethods = order.payment_methods || [];
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    () => paymentMethods[0]?.id || "",
  );
  const selectedMethod = paymentMethods.find(
    (pm) => pm.id === selectedMethodId,
  );

  // --- Payment session & gateway state ---
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [gatewayReady, setGatewayReady] = useState(false);
  const gatewayRef = useRef<PaymentGatewayHandle>(null);
  const initRef = useRef(false);

  // --- Session creation ---
  const createSession = useCallback(
    async (
      method: PaymentMethod,
      externalData?: Record<string, unknown>,
    ): Promise<PaymentSession | null> => {
      setLoading(true);
      setGatewayError(null);
      setPaymentSession(null);
      setGatewayReady(false);

      try {
        const result = await createCheckoutPaymentSession(
          order.id,
          method.id,
          externalData,
        );

        if (result.success && result.session) {
          setPaymentSession(result.session);
          return result.session;
        }
        if (!result.success) {
          setGatewayError(result.error || "Failed to create payment session.");
        }
        return null;
      } catch {
        setGatewayError("Failed to initialize payment. Please try again.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [order.id],
  );

  // Gateway callback to request a new session (e.g. when switching saved cards).
  // Unlike createSession, this does NOT reset loading/paymentSession state
  // to avoid unmounting the gateway component (which manages its own loading).
  const handleCreateSession = useCallback(
    async (
      externalData?: Record<string, unknown>,
    ): Promise<PaymentSession | null> => {
      if (!selectedMethod) return null;

      setGatewayError(null);

      try {
        const result = await createCheckoutPaymentSession(
          order.id,
          selectedMethod.id,
          externalData,
        );

        if (result.success && result.session) {
          setPaymentSession(result.session);
          return result.session;
        }
        if (!result.success) {
          setGatewayError(result.error || "Failed to create payment session.");
        }
        return null;
      } catch {
        setGatewayError("Failed to initialize payment. Please try again.");
        return null;
      }
    },
    [selectedMethod, order.id],
  );

  // --- Initialize session for the first selected method ---
  useEffect(() => {
    if (initRef.current || !selectedMethod) return;
    initRef.current = true;

    if (selectedMethod.session_required) {
      createSession(selectedMethod);
    } else {
      // Non-session methods are ready immediately
      setGatewayReady(true);
    }
  }, [selectedMethod, createSession]);

  // --- Method switching ---
  const handleMethodSelect = (methodId: string) => {
    if (methodId === selectedMethodId) return;
    setSelectedMethodId(methodId);

    const method = paymentMethods.find((pm) => pm.id === methodId);
    if (!method) return;

    setPaymentSession(null);
    setGatewayError(null);
    setGatewayReady(false);
    gatewayRef.current = null;

    if (method.session_required) {
      createSession(method);
    } else {
      setGatewayReady(true);
    }
  };

  // --- Billing address ---
  useEffect(() => {
    if (useShippingForBilling || !billAddress.country_iso) {
      setBillStates([]);
      return;
    }

    let cancelled = false;

    startTransitionBill(() => {
      fetchStates(billAddress.country_iso)
        .then((states) => {
          if (!cancelled) setBillStates(states);
        })
        .catch(() => {
          if (!cancelled) setBillStates([]);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [billAddress.country_iso, useShippingForBilling, fetchStates]);

  const handleUseShippingChange = (checked: boolean) => {
    setUseShippingForBilling(checked);
    if (checked) {
      setBillAddress(shipAddressData);
    }
  };

  const updateBillAddress = (field: keyof AddressFormData, value: string) => {
    setBillAddress((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "country_iso") {
        updated.state_abbr = "";
        updated.state_name = "";
      }
      return updated;
    });
  };

  // --- Gateway callbacks ---
  const handleGatewayReady = useCallback(() => {
    setGatewayReady(true);
  }, []);

  const handleGatewayError = useCallback((message: string) => {
    setGatewayError(message);
  }, []);

  // --- Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethod) return;

    setProcessing(true);
    setGatewayError(null);

    try {
      // 1. Update billing address
      const billingData = formDataToAddress(
        useShippingForBilling ? shipAddressData : billAddress,
      );
      const addressSuccess = await onUpdateBillingAddress({
        bill_address: billingData,
      });
      if (!addressSuccess) {
        setProcessing(false);
        return;
      }

      if (selectedMethod.session_required) {
        // 2a. Confirm with gateway
        if (!gatewayRef.current || !paymentSession) {
          setProcessing(false);
          return;
        }

        const returnUrl = `${window.location.origin}${window.location.pathname.replace(/\/checkout\/.*/, `/order-placed/${order.id}`)}`;
        const result = await gatewayRef.current.confirmPayment(returnUrl);

        if (result.error) {
          setGatewayError(result.error);
          setProcessing(false);
          return;
        }

        // 3a. Complete session and order
        await onPaymentComplete(paymentSession.id, selectedMethod.id);
      } else {
        // 2b. Non-session methods (check, bank transfer, etc.)
        // No payment session — create a payment record directly
        await onPaymentComplete(null, selectedMethod.id);
      }
    } catch {
      setGatewayError("An error occurred during payment. Please try again.");
      setProcessing(false);
    }
  };

  // --- Resolve gateway component for the selected method ---
  const resolveGatewayComponent = (method: PaymentMethod) => {
    if (method.session_required) {
      return getGatewayComponent(method.type);
    }
    return null;
  };

  // Render the gateway content for a given method
  const renderGatewayContent = (method: PaymentMethod) => {
    if (method.id !== selectedMethodId) return null;

    // Gateway error
    const errorBanner = gatewayError && !loading && (
      <Alert variant="destructive" className="mb-4">
        <CircleAlert />
        <AlertDescription>{gatewayError}</AlertDescription>
      </Alert>
    );

    // Loading
    if (loading) {
      return (
        <>
          {errorBanner}
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
            <span className="ml-3 text-sm text-gray-500">
              Loading payment form...
            </span>
          </div>
        </>
      );
    }

    // Session-based gateway
    if (method.session_required && paymentSession) {
      const GatewayComponent = resolveGatewayComponent(method);
      if (GatewayComponent) {
        return (
          <>
            {errorBanner}
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
                  <span className="ml-3 text-sm text-gray-500">
                    Loading payment form...
                  </span>
                </div>
              }
            >
              <GatewayComponent
                key={selectedMethodId}
                ref={gatewayRef}
                paymentMethod={method}
                paymentSession={paymentSession}
                order={order}
                isAuthenticated={isAuthenticated}
                onReady={handleGatewayReady}
                onError={handleGatewayError}
                onCreateSession={handleCreateSession}
              />
            </Suspense>
          </>
        );
      }

      return (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <CreditCard
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
            strokeWidth={1.5}
          />
          <p className="text-gray-500">
            Payment gateway not configured for {method.name}.
          </p>
        </div>
      );
    }

    // Non-session gateway
    if (!method.session_required) {
      return (
        <>
          {errorBanner}
          <SimpleConfirmationGateway
            ref={gatewayRef}
            paymentMethod={method}
            paymentSession={paymentSession!}
            order={order}
            isAuthenticated={isAuthenticated}
            onReady={handleGatewayReady}
            onError={handleGatewayError}
            onCreateSession={handleCreateSession}
          />
        </>
      );
    }

    return errorBanner;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Shipping Address Summary */}
      {order.ship_address && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Shipping Address
            </h2>
            {onBack && (
              <Button type="button" variant="link" size="sm" onClick={onBack}>
                Edit
              </Button>
            )}
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900">
              {order.ship_address.full_name}
            </p>
            {order.ship_address.company && <p>{order.ship_address.company}</p>}
            <p>{order.ship_address.address1}</p>
            {order.ship_address.address2 && (
              <p>{order.ship_address.address2}</p>
            )}
            <p>
              {order.ship_address.city},{" "}
              {order.ship_address.state_text || order.ship_address.state_name}{" "}
              {order.ship_address.zipcode}
            </p>
            <p>{order.ship_address.country_name}</p>
          </div>
        </div>
      )}

      {/* Billing Address */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Billing Address
        </h2>
        <div className="mb-4">
          <Field orientation="horizontal">
            <Checkbox
              id="use-shipping-billing"
              checked={useShippingForBilling}
              onCheckedChange={(checked) =>
                handleUseShippingChange(checked === true)
              }
            />
            <FieldLabel htmlFor="use-shipping-billing">
              Same as shipping address
            </FieldLabel>
          </Field>
        </div>

        {!useShippingForBilling && (
          <AddressFormFields
            address={billAddress}
            countries={countries}
            states={billStates}
            loadingStates={isPendingBill}
            onChange={updateBillAddress}
            idPrefix="bill"
          />
        )}
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Payment Method
        </h2>

        {paymentMethods.length > 1 ? (
          <PaymentMethodSelector
            paymentMethods={paymentMethods}
            selectedMethodId={selectedMethodId}
            onSelect={handleMethodSelect}
            disabled={processing || loading}
            renderContent={renderGatewayContent}
          />
        ) : selectedMethod ? (
          renderGatewayContent(selectedMethod)
        ) : (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <CreditCard
              className="w-12 h-12 text-gray-400 mx-auto mb-4"
              strokeWidth={1.5}
            />
            <p className="text-gray-500">
              No payment methods available for this order.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        {onBack && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onBack}
            disabled={processing}
          >
            Back
          </Button>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={processing || loading || !selectedMethod || !gatewayReady}
        >
          {processing ? "Processing..." : "Pay Now"}
        </Button>
      </div>
    </form>
  );
}
