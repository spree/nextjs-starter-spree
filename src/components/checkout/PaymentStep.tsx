"use client";

import type {
  AddressParams,
  StoreCountry,
  StoreOrder,
  StoreState,
} from "@spree/sdk";
import { useEffect, useState, useTransition } from "react";
import {
  type AddressFormData,
  addressesMatch,
  addressToFormData,
  formDataToAddress,
} from "@/lib/utils/address";
import { AddressFormFields } from "./AddressFormFields";

interface PaymentStepProps {
  order: StoreOrder;
  countries: StoreCountry[];
  fetchStates: (countryIso: string) => Promise<StoreState[]>;
  onSubmit: (data: {
    bill_address: AddressParams;
    use_shipping_for_billing: boolean;
  }) => Promise<void>;
  onBack: () => void;
  processing: boolean;
}

export function PaymentStep({
  order,
  countries,
  fetchStates,
  onSubmit,
  onBack,
  processing,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      bill_address: formDataToAddress(
        useShippingForBilling ? shipAddressData : billAddress,
      ),
      use_shipping_for_billing: useShippingForBilling,
    });
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

      {/* Payment Methods - Placeholder */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Payment Method
        </h2>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          <p className="text-gray-500">
            Payment methods will be available soon.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            For now, orders can be completed without payment.
          </p>
        </div>
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
          disabled={processing}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? "Processing..." : "Complete Order"}
        </button>
      </div>
    </form>
  );
}
