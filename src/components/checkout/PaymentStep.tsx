"use client";

import type {
  AddressParams,
  StoreCountry,
  StoreCreditCard,
  StoreOrder,
  StoreState,
} from "@spree/sdk";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { PaymentIcon } from "react-svg-credit-card-payment-icons";
import { CreditCardIcon } from "@/components/icons";
import { getCreditCards } from "@/lib/data/credit-cards";
import { createCheckoutPaymentSession } from "@/lib/data/payment";
import {
  type AddressFormData,
  addressesMatch,
  addressToFormData,
  formDataToAddress,
} from "@/lib/utils/address";
import { getCardIconType, getCardLabel } from "@/lib/utils/credit-card";
import { AddressFormFields } from "./AddressFormFields";
import {
  confirmWithSavedCard,
  StripePaymentForm,
  type StripePaymentFormHandle,
} from "./StripePaymentForm";

interface PaymentStepProps {
  order: StoreOrder;
  countries: StoreCountry[];
  isAuthenticated: boolean;
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
  isAuthenticated,
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

  // Saved cards state
  const [savedCards, setSavedCards] = useState<StoreCreditCard[]>([]);
  // null = "add new payment method", string = gateway_payment_profile_id of selected card
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Payment gateway state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gatewayReady, setGatewayReady] = useState(false);
  const gatewayHandleRef = useRef<StripePaymentFormHandle | null>(null);
  const initRef = useRef(false);

  const handleGatewayReady = useCallback((handle: StripePaymentFormHandle) => {
    gatewayHandleRef.current = handle;
    setGatewayReady(true);
  }, []);

  // Find the payment method that requires a session (e.g. Stripe, Adyen)
  const sessionPaymentMethod = order.payment_methods?.find(
    (pm) => pm.session_required,
  );

  // Helper: create a payment session
  const createSession = useCallback(
    async (cardId: string | null) => {
      if (!sessionPaymentMethod) return;

      setLoading(true);
      setGatewayError(null);
      setClientSecret(null);
      setPaymentSessionId(null);
      gatewayHandleRef.current = null;
      setGatewayReady(false);

      try {
        const result = await createCheckoutPaymentSession(
          order.id,
          sessionPaymentMethod.id,
          cardId ?? undefined,
        );

        if (result.success && result.session) {
          const secret = result.session.external_data?.client_secret as
            | string
            | undefined;
          if (secret) {
            setClientSecret(secret);
            setPaymentSessionId(result.session.id);
          } else {
            setGatewayError("Failed to initialize payment. Please try again.");
          }
        } else if (!result.success) {
          setGatewayError(result.error || "Failed to create payment session.");
        }
      } catch {
        setGatewayError("Failed to initialize payment. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [sessionPaymentMethod, order.id],
  );

  // On mount: load saved cards (if authenticated), then create initial session — once.
  useEffect(() => {
    if (initRef.current || !sessionPaymentMethod) return;
    initRef.current = true;

    const init = async () => {
      setLoading(true);

      let initialCardId: string | null = null;

      // Load saved cards for authenticated users
      if (isAuthenticated) {
        try {
          const result = await getCreditCards();
          const gatewayCards = result.data.filter(
            (card) => card.gateway_payment_profile_id,
          );
          setSavedCards(gatewayCards);

          if (gatewayCards.length > 0) {
            const defaultCard =
              gatewayCards.find((c) => c.default) || gatewayCards[0];
            initialCardId = defaultCard.gateway_payment_profile_id;
            setSelectedCardId(initialCardId);
          }
        } catch {
          // Cards failed to load — proceed without saved cards
        }
      }

      // Create the initial payment session
      await createSession(initialCardId);
    };

    init();
  }, [sessionPaymentMethod, isAuthenticated, createSession]);

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

  const handleCardSelect = (cardId: string | null) => {
    if (cardId === selectedCardId) return;
    setSelectedCardId(cardId);
    createSession(cardId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentSessionId || !clientSecret) return;
    if (!selectedCardId && !gatewayHandleRef.current) return;

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

      // 2. Confirm payment with gateway
      const returnUrl = `${window.location.origin}${window.location.pathname.replace(/\/checkout\/.*/, `/order-placed/${order.id}`)}`;

      let error: string | undefined;

      if (selectedCardId) {
        // Confirm with saved payment method — no Elements needed
        const result = await confirmWithSavedCard(
          clientSecret,
          selectedCardId,
          returnUrl,
        );
        error = result.error;
      } else {
        // Confirm with new card via payment form
        const result =
          await gatewayHandleRef.current!.confirmPayment(returnUrl);
        error = result.error;
      }

      if (error) {
        setGatewayError(error);
        setProcessing(false);
        return;
      }

      // 3. Payment succeeded — complete session and order
      await onPaymentComplete(paymentSessionId);
    } catch {
      setGatewayError("An error occurred during payment. Please try again.");
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

  const isAddingNew = selectedCardId === null;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Shipping Address Summary */}
      {order.ship_address && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Shipping Address
            </h2>
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-primary-600 hover:text-primary-700"
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
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Billing Address
        </h2>
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useShippingForBilling}
              onChange={(e) => handleUseShippingChange(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
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
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Payment Method
        </h2>

        {/* Saved Cards Selector */}
        {savedCards.length > 0 && (
          <div className="space-y-3 mb-6">
            {savedCards.map((card) => (
              <label
                key={card.id}
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  selectedCardId === card.gateway_payment_profile_id
                    ? "border-primary-600 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment_source"
                  checked={selectedCardId === card.gateway_payment_profile_id}
                  onChange={() =>
                    handleCardSelect(card.gateway_payment_profile_id)
                  }
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <PaymentIcon
                  type={getCardIconType(card.cc_type)}
                  format="flatRounded"
                  width={40}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900">
                    {getCardLabel(card.cc_type)} ending in {card.last_digits}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    Exp {String(card.month).padStart(2, "0")}/{card.year}
                  </span>
                </div>
                {card.default && (
                  <span className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">
                    Default
                  </span>
                )}
              </label>
            ))}

            {/* Add new payment method option */}
            <label
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                isAddingNew
                  ? "border-primary-600 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="payment_source"
                checked={isAddingNew}
                onChange={() => handleCardSelect(null)}
                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />
              <CreditCardIcon
                className="w-5 h-5 text-gray-400"
                strokeWidth={1.5}
              />
              <span className="text-sm font-medium text-gray-900">
                Add new payment method
              </span>
            </label>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            <span className="ml-3 text-sm text-gray-500">
              Loading payment form...
            </span>
          </div>
        )}

        {gatewayError && !loading && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">
            {gatewayError}
          </div>
        )}

        {clientSecret && !loading && isAddingNew && (
          <StripePaymentForm
            key={clientSecret}
            clientSecret={clientSecret}
            onReady={handleGatewayReady}
          />
        )}

        {!sessionPaymentMethod && !loading && (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
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
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={
            processing ||
            loading ||
            !sessionPaymentMethod ||
            !clientSecret ||
            (isAddingNew && !gatewayReady)
          }
          className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? "Processing..." : "Pay Now"}
        </button>
      </div>
    </form>
  );
}
