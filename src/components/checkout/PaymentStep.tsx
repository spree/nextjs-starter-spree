"use client";

import type {
  AddressParams,
  StoreCountry,
  StoreOrder,
  StoreState,
} from "@spree/sdk";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { CreditCardIcon } from "@/components/icons";
import { createCheckoutPaymentSession } from "@/lib/data/payment";
import {
  type AddressFormData,
  addressesMatch,
  addressToFormData,
  formDataToAddress,
} from "@/lib/utils/address";
import { AddressFormFields } from "./AddressFormFields";
import {
  StripePaymentForm,
  type StripePaymentFormHandle,
} from "./StripePaymentForm";

interface PaymentStepProps {
  order: StoreOrder;
  countries: StoreCountry[];
  fetchStates: (countryIso: string) => Promise<StoreState[]>;
  onUpdateBillingAddress: (data: {
    bill_address: AddressParams;
  }) => Promise<boolean>;
  onPaymentComplete: (paymentSessionId: string) => Promise<void>;
  onBack: () => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
}

export function PaymentStep({
  order,
  countries,
  fetchStates,
  onUpdateBillingAddress,
  onPaymentComplete,
  onBack,
  processing,
  setProcessing,
}: PaymentStepProps) {
  // Initialize billing address from order, check if it matches shipping
  const shipAddressData = addressToFormData(order.ship_address);
  const billAddressData = addressToFormData(order.bill_address);
  const initialUseShipping =
    !order.bill_address || addressesMatch(shipAddressData, order.bill_address);

  const [billAddress, setBillAddress] = useState<AddressFormData>(
    initialUseShipping ? shipAddressData : billAddressData,
  );
  const [useShippingForBilling, setUseShippingForBilling] =
    useState(initialUseShipping);
  const [billStates, setBillStates] = useState<StoreState[]>([]);
  const [isPendingBill, startTransitionBill] = useTransition();

  // Stripe state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const stripeHandleRef = useRef<StripePaymentFormHandle | null>(null);
  const lastOrderTotalRef = useRef<string | undefined>(order.total);

  const handleStripeReady = useCallback((handle: StripePaymentFormHandle) => {
    stripeHandleRef.current = handle;
  }, []);

  // Find Stripe payment method
  const stripePaymentMethod = order.payment_methods?.find(
    (pm) => pm.session_required,
  );

  // Reset payment session when order total changes (e.g., coupon applied/removed)
  if (order.total !== lastOrderTotalRef.current && clientSecret) {
    lastOrderTotalRef.current = order.total;
    setClientSecret(null);
    setPaymentSessionId(null);
    setStripeError(null);
    stripeHandleRef.current = null;
  }
  lastOrderTotalRef.current = order.total;

  // Create payment session when needed (on mount or after total changes)
  useEffect(() => {
    if (!stripePaymentMethod || clientSecret) return;

    let cancelled = false;
    setLoadingSession(true);

    createCheckoutPaymentSession(order.id, stripePaymentMethod.id).then(
      (result) => {
        if (cancelled) return;
        setLoadingSession(false);

        if (result.success && result.session) {
          const secret = result.session.external_data?.client_secret as
            | string
            | undefined;
          if (secret) {
            setClientSecret(secret);
            setPaymentSessionId(result.session.id);
          } else {
            setStripeError("Failed to initialize payment. Please try again.");
          }
        } else if (!result.success) {
          setStripeError(result.error || "Failed to create payment session.");
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [stripePaymentMethod, order.id, clientSecret]);

  // Load states when billing country changes
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripeHandleRef.current || !paymentSessionId) return;

    setProcessing(true);
    setStripeError(null);

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

      // 2. Confirm payment with Stripe
      const returnUrl = `${window.location.origin}${window.location.pathname.replace(/\/checkout\/.*/, `/order-placed/${order.id}`)}`;
      const { error } =
        await stripeHandleRef.current!.confirmPayment(returnUrl);

      if (error) {
        setStripeError(error);
        setProcessing(false);
        return;
      }

      // 3. Payment succeeded — complete session and order
      await onPaymentComplete(paymentSessionId);
    } catch {
      setStripeError("An error occurred during payment. Please try again.");
      setProcessing(false);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Shipping Address Summary */}
      {order.ship_address && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Shipping Address
            </h2>
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Edit
            </button>
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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Billing Address
        </h2>
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useShippingForBilling}
              onChange={(e) => handleUseShippingChange(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-600">
              Same as shipping address
            </span>
          </label>
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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Payment Method
        </h2>

        {loadingSession && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            <span className="ml-3 text-sm text-gray-500">
              Loading payment form...
            </span>
          </div>
        )}

        {stripeError && !loadingSession && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
            {stripeError}
          </div>
        )}

        {clientSecret && !loadingSession && (
          <StripePaymentForm
            key={clientSecret}
            clientSecret={clientSecret}
            onReady={handleStripeReady}
          />
        )}

        {!stripePaymentMethod && !loadingSession && (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <CreditCardIcon
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
        <button
          type="button"
          onClick={onBack}
          disabled={processing}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={
            processing ||
            loadingSession ||
            (!clientSecret && !!stripePaymentMethod)
          }
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? "Processing..." : "Pay Now"}
        </button>
      </div>
    </form>
  );
}
