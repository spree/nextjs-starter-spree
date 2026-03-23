"use client";

import type {
  AddressParams,
  Cart,
  Country,
  CreditCard as SpreeCreditCard,
  State,
} from "@spree/sdk";
import { CircleAlert, CreditCard, Loader2 } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { PaymentIcon } from "react-svg-credit-card-payment-icons";
import { AddressFormFields } from "@/components/checkout/AddressFormFields";
import {
  confirmWithSavedCard,
  StripePaymentForm,
  type StripePaymentFormHandle,
} from "@/components/checkout/StripePaymentForm";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCountryStates } from "@/hooks/useCountryStates";
import { getCreditCards } from "@/lib/data/credit-cards";
import { createCheckoutPaymentSession } from "@/lib/data/payment";
import {
  type AddressFormData,
  addressToFormData,
  formDataToAddress,
  updateAddressField,
} from "@/lib/utils/address";
import { getCardIconType, getCardLabel } from "@/lib/utils/credit-card";
import { extractBasePath } from "@/lib/utils/path";

export interface PaymentSectionHandle {
  submit: () => Promise<{ error?: string }>;
}

interface PaymentSectionProps {
  cart: Cart;
  countries: Country[];
  isAuthenticated: boolean;
  fetchStates: (countryIso: string) => Promise<State[]>;
  onUpdateBillingAddress: (data: {
    billing_address?: AddressParams;
    use_shipping?: boolean;
  }) => Promise<boolean>;
  onPaymentComplete: (paymentSessionId: string) => Promise<void>;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
  errors?: string[];
}

export const PaymentSection = forwardRef<
  PaymentSectionHandle,
  PaymentSectionProps
>(function PaymentSection(
  {
    cart,
    countries,
    isAuthenticated,
    fetchStates,
    onUpdateBillingAddress,
    onPaymentComplete,
    processing,
    setProcessing,
    errors,
  },
  ref,
) {
  // Initialize billing address from cart, check if it matches shipping
  const shipAddressData = useMemo(
    () => addressToFormData(cart.shipping_address),
    [cart.shipping_address],
  );
  const billAddressData = useMemo(
    () => addressToFormData(cart.billing_address),
    [cart.billing_address],
  );
  const initialUseShipping =
    !cart.billing_address || cart.shipping_eq_billing_address;

  const [billAddress, setBillAddress] = useState<AddressFormData>(
    initialUseShipping ? shipAddressData : billAddressData,
  );
  const [useShippingForBilling, setUseShippingForBilling] =
    useState(initialUseShipping);
  // Saved cards state
  const [savedCards, setSavedCards] = useState<SpreeCreditCard[]>([]);
  // null = "add new payment method", string = gateway_payment_profile_id of selected card
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Payment gateway state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const gatewayHandleRef = useRef<StripePaymentFormHandle | null>(null);
  const initRef = useRef(false);
  // Monotonic counter to discard stale createSession responses
  const sessionRequestIdRef = useRef(0);

  const handleGatewayReady = useCallback((handle: StripePaymentFormHandle) => {
    gatewayHandleRef.current = handle;
  }, []);

  // Find the payment method that requires a session (e.g. Stripe, Adyen)
  const sessionPaymentMethod = cart.payment_methods?.find(
    (pm) => pm.session_required,
  );

  // Helper: create a payment session
  const createSession = useCallback(
    async (cardId: string | null) => {
      if (!sessionPaymentMethod) return;

      const requestId = ++sessionRequestIdRef.current;

      setLoading(true);
      setGatewayError(null);
      setClientSecret(null);
      setPaymentSessionId(null);
      gatewayHandleRef.current = null;

      try {
        const result = await createCheckoutPaymentSession(
          cart.id,
          sessionPaymentMethod.id,
          cardId ?? undefined,
        );

        // Discard if a newer request was started while this one was in flight
        if (requestId !== sessionRequestIdRef.current) return;

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
        if (requestId !== sessionRequestIdRef.current) return;
        setGatewayError("Failed to initialize payment. Please try again.");
      } finally {
        if (requestId === sessionRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [sessionPaymentMethod, cart.id],
  );

  // Track the cart total so we can recreate the session when it changes
  const lastTotalRef = useRef<string | null>(null);
  const selectedCardRef = useRef<string | null>(null);

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

      selectedCardRef.current = initialCardId;
      lastTotalRef.current = cart.total;

      // Create the initial payment session
      await createSession(initialCardId);
    };

    init();
  }, [sessionPaymentMethod, isAuthenticated, createSession, cart.total]);

  // When cart total changes (shipping rate, coupon, etc.), recreate the
  // payment session so the amount matches the new order total.
  useEffect(() => {
    if (!initRef.current) return;
    if (lastTotalRef.current === cart.total) return;

    lastTotalRef.current = cart.total;
    createSession(selectedCardRef.current);
  }, [cart.total, createSession]);

  const [billStates, isPendingBill] = useCountryStates(
    billAddress.country_iso,
    fetchStates,
    !useShippingForBilling,
  );

  const handleUseShippingChange = (checked: boolean) => {
    setUseShippingForBilling(checked);
    if (checked) {
      setBillAddress(shipAddressData);
    }
  };

  const handleCardSelect = (cardId: string | null) => {
    if (cardId === selectedCardId) return;
    setSelectedCardId(cardId);
    selectedCardRef.current = cardId;
    createSession(cardId);
  };

  const updateBillAddress = (field: keyof AddressFormData, value: string) => {
    setBillAddress((prev) => updateAddressField(prev, field, value));
  };

  // Expose submit handle to parent via ref
  useImperativeHandle(
    ref,
    () => ({
      submit: async () => {
        if (!paymentSessionId || !clientSecret) {
          return { error: "Payment not ready" };
        }
        if (!selectedCardId && !gatewayHandleRef.current) {
          return { error: "Payment not ready" };
        }

        setProcessing(true);
        setGatewayError(null);

        try {
          // 1. Update billing address
          let addressSuccess: boolean;
          if (useShippingForBilling) {
            addressSuccess = await onUpdateBillingAddress({
              use_shipping: true,
            });
          } else {
            const billingData = formDataToAddress(billAddress);
            addressSuccess = await onUpdateBillingAddress({
              billing_address: billingData,
            });
          }

          if (!addressSuccess) {
            setProcessing(false);
            return { error: "Failed to save billing address" };
          }

          // 2. Confirm payment with gateway
          // Point to the confirm-payment intermediate page so that offsite
          // gateways (3D Secure, redirect-based) can verify the payment
          // session before completing the cart.
          const basePath = extractBasePath(window.location.pathname);
          const returnUrl = `${window.location.origin}${basePath}/confirm-payment/${cart.id}?session=${paymentSessionId}`;

          let error: string | undefined;

          if (selectedCardId) {
            const result = await confirmWithSavedCard(
              clientSecret,
              selectedCardId,
              returnUrl,
            );
            error = result.error;
          } else {
            const result =
              await gatewayHandleRef.current!.confirmPayment(returnUrl);
            error = result.error;
          }

          if (error) {
            setGatewayError(error);
            setProcessing(false);
            return { error };
          }

          // 3. Payment succeeded — complete session and cart
          await onPaymentComplete(paymentSessionId);
          return {};
        } catch {
          const msg = "An error occurred during payment. Please try again.";
          setGatewayError(msg);
          setProcessing(false);
          return { error: msg };
        }
      },
    }),
    [
      paymentSessionId,
      clientSecret,
      selectedCardId,
      useShippingForBilling,
      billAddress,
      onUpdateBillingAddress,
      onPaymentComplete,
      cart.id,
      setProcessing,
    ],
  );

  const isAddingNew = selectedCardId === null;

  return (
    <div>
      {/* Section Header */}
      <h2 className="text-lg font-bold text-gray-900">Payment</h2>
      <p className="text-sm text-gray-500 mt-0.5 mb-3">
        All transactions are secure and encrypted.
      </p>

      {/* Inline requirement errors from parent */}
      {errors && errors.length > 0 && (
        <div className="rounded-sm border border-red-300 bg-red-50 px-4 py-3 mb-3">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-red-700">
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Payment method bordered container — Shopify style */}
      <RadioGroup
        value={selectedCardId ?? "__new__"}
        onValueChange={(val) =>
          handleCardSelect(val === "__new__" ? null : val)
        }
        className="rounded-sm border overflow-hidden gap-0"
      >
        {/* Saved Cards */}
        {savedCards.length > 0 && (
          <>
            {savedCards.map((card, index) => (
              <label
                key={card.id}
                className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
                  selectedCardId === card.gateway_payment_profile_id
                    ? "bg-blue-50"
                    : "bg-white hover:bg-gray-50"
                } ${index > 0 ? "border-t" : ""}`}
              >
                <RadioGroupItem
                  value={card.gateway_payment_profile_id ?? card.id}
                />
                <PaymentIcon
                  type={getCardIconType(card.brand)}
                  format="flatRounded"
                  width={34}
                />
                <span className="text-sm text-gray-900 flex-1">
                  {getCardLabel(card.brand)} ending in {card.last4}
                </span>
                <span className="text-xs text-gray-500">
                  Exp {String(card.month).padStart(2, "0")}/{card.year}
                </span>
                {card.default && (
                  <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    Default
                  </span>
                )}
              </label>
            ))}

            {/* Add new card option */}
            <label
              className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer border-t transition-colors ${
                isAddingNew ? "bg-blue-50" : "bg-white hover:bg-gray-50"
              }`}
            >
              <RadioGroupItem value="__new__" />
              <CreditCard className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
              <span className="text-sm text-gray-900">
                Add new payment method
              </span>
            </label>
          </>
        )}

        {/* Credit card header when no saved cards */}
        {savedCards.length === 0 && (
          <div className="flex items-center justify-between px-4 py-3.5 bg-blue-50">
            <div className="flex items-center gap-3">
              <RadioGroupItem value="__new__" />
              <span className="text-sm font-medium text-gray-900">
                Credit card
              </span>
            </div>
          </div>
        )}

        {/* Card form area — inside the bordered container */}
        <div className="border-t bg-gray-50">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">
                Loading payment form...
              </span>
            </div>
          )}

          {gatewayError && !loading && (
            <div className="px-4 py-3">
              <div className="rounded-sm border border-red-300 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700 flex items-center gap-2">
                  <CircleAlert className="h-4 w-4 flex-shrink-0" />
                  {gatewayError}
                </p>
              </div>
            </div>
          )}

          {clientSecret && !loading && isAddingNew && (
            <div className="p-4">
              <StripePaymentForm
                key={clientSecret}
                clientSecret={clientSecret}
                onReady={handleGatewayReady}
              />
            </div>
          )}

          {!sessionPaymentMethod && !loading && (
            <div className="px-4 py-8 text-center">
              <CreditCard
                className="w-10 h-10 text-gray-300 mx-auto mb-3"
                strokeWidth={1.5}
              />
              <p className="text-sm text-gray-500">
                No payment methods available for this cart.
              </p>
            </div>
          )}
        </div>
      </RadioGroup>

      {/* Billing address — Shopify checkbox below payment box */}
      <div className="mt-4">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <Checkbox
            checked={useShippingForBilling}
            onCheckedChange={(checked) =>
              handleUseShippingChange(checked === true)
            }
          />
          <span className="text-sm text-gray-900">
            Use shipping address as billing address
          </span>
        </label>

        {!useShippingForBilling && (
          <div className="mt-4">
            <AddressFormFields
              address={billAddress}
              countries={countries}
              states={billStates}
              loadingStates={isPendingBill}
              onChange={updateBillAddress}
              idPrefix="bill"
            />
          </div>
        )}
      </div>
    </div>
  );
});
