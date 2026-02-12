"use client";

import type {
  AddressParams,
  StoreAddress,
  StoreCountry,
  StoreOrder,
  StoreState,
} from "@spree/sdk";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  type AddressFormData,
  addressToFormData,
  formDataToAddress,
} from "@/lib/utils/address";
import { AddressEditModal } from "./AddressEditModal";
import { AddressFormFields } from "./AddressFormFields";
import { AddressSelector } from "./AddressSelector";

interface AddressStepProps {
  order: StoreOrder;
  countries: StoreCountry[];
  savedAddresses: StoreAddress[];
  isAuthenticated: boolean;
  signInUrl: string;
  fetchStates: (countryIso: string) => Promise<StoreState[]>;
  onSubmit: (data: {
    email: string;
    ship_address?: AddressParams;
    ship_address_id?: string;
  }) => Promise<void>;
  onUpdateSavedAddress?: (
    id: string,
    data: AddressParams,
  ) => Promise<StoreAddress | null>;
  processing: boolean;
}

export function AddressStep({
  order,
  countries,
  savedAddresses: initialSavedAddresses,
  isAuthenticated,
  signInUrl,
  fetchStates,
  onSubmit,
  onUpdateSavedAddress,
  processing,
}: AddressStepProps) {
  const [email, setEmail] = useState(order.email || "");
  const [shipAddress, setShipAddress] = useState<AddressFormData>(() =>
    addressToFormData(order.ship_address),
  );
  const [shipStates, setShipStates] = useState<StoreState[]>([]);
  const [isPendingShip, startTransitionShip] = useTransition();
  const [savedAddresses, setSavedAddresses] = useState(initialSavedAddresses);
  const [editingAddress, setEditingAddress] = useState<StoreAddress | null>(
    null,
  );

  // Load states when shipping country changes
  useEffect(() => {
    if (!shipAddress.country_iso) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShipStates([]);
      return;
    }

    let cancelled = false;

    startTransitionShip(() => {
      fetchStates(shipAddress.country_iso).then((states) => {
        if (!cancelled) {
          setShipStates(states);
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [shipAddress.country_iso, fetchStates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      email,
      ship_address: formDataToAddress(shipAddress),
    });
  };

  const updateShipAddress = (field: keyof AddressFormData, value: string) => {
    setShipAddress((prev) => {
      const updated = { ...prev, [field]: value };
      // Clear state when country changes
      if (field === "country_iso") {
        updated.state_abbr = "";
        updated.state_name = "";
      }
      return updated;
    });
  };

  const handleSelectSavedAddress = (address: StoreAddress) => {
    setShipAddress(addressToFormData(address));
  };

  const handleSaveEditedAddress = async (data: AddressParams, id?: string) => {
    if (!id || !onUpdateSavedAddress) {
      throw new Error("Cannot update address");
    }

    const updatedAddress = await onUpdateSavedAddress(id, data);
    if (updatedAddress) {
      setSavedAddresses((prev) =>
        prev.map((addr) => (addr.id === id ? updatedAddress : addr)),
      );
      handleSelectSavedAddress(updatedAddress);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Sign-in prompt for guests */}
        {!isAuthenticated && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Already have an account?{" "}
              <Link
                href={signInUrl}
                className="font-medium text-blue-600 hover:text-blue-700 underline"
              >
                Sign in
              </Link>{" "}
              to access your saved addresses and order history.
            </p>
          </div>
        )}

        {/* Contact Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Contact Information
          </h2>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isAuthenticated}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="you@example.com"
            />
            {isAuthenticated && (
              <p className="mt-1 text-xs text-gray-500">
                Using your account email address
              </p>
            )}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Shipping Address
          </h2>
          {isAuthenticated && savedAddresses.length > 0 ? (
            <AddressSelector
              savedAddresses={savedAddresses}
              currentAddress={shipAddress}
              countries={countries}
              states={shipStates}
              loadingStates={isPendingShip}
              onChange={updateShipAddress}
              onSelectSavedAddress={handleSelectSavedAddress}
              onEditAddress={
                onUpdateSavedAddress
                  ? (address) => setEditingAddress(address)
                  : undefined
              }
              idPrefix="ship"
            />
          ) : (
            <AddressFormFields
              address={shipAddress}
              countries={countries}
              states={shipStates}
              loadingStates={isPendingShip}
              onChange={updateShipAddress}
              idPrefix="ship"
            />
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={processing}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? "Saving..." : "Continue to Delivery"}
          </button>
        </div>
      </form>

      {/* Edit Address Modal */}
      {editingAddress && (
        <AddressEditModal
          address={editingAddress}
          countries={countries}
          fetchStates={fetchStates}
          onSave={handleSaveEditedAddress}
          onClose={() => setEditingAddress(null)}
          title="Edit Address"
        />
      )}
    </>
  );
}
