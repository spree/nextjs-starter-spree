"use client";

import type {
  Address,
  AddressParams,
  Cart,
  Country,
  Order,
  State,
} from "@spree/sdk";
import { InfoIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  type AddressFormData,
  addressToFormData,
  formDataToAddress,
} from "@/lib/utils/address";
import { AddressEditModal } from "./AddressEditModal";
import { AddressFormFields } from "./AddressFormFields";
import { AddressSelector } from "./AddressSelector";

interface AddressStepProps {
  order: Cart | Order;
  countries: Country[];
  savedAddresses: Address[];
  isAuthenticated: boolean;
  signInUrl: string;
  fetchStates: (countryIso: string) => Promise<State[]>;
  onSubmit: (data: {
    email: string;
    ship_address?: AddressParams;
    ship_address_id?: string;
  }) => Promise<void>;
  onUpdateSavedAddress?: (
    id: string,
    data: AddressParams,
  ) => Promise<Address | null>;
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
  const [shipStates, setShipStates] = useState<State[]>([]);
  const [isPendingShip, startTransitionShip] = useTransition();
  const [savedAddresses, setSavedAddresses] = useState(initialSavedAddresses);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

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

  const handleSelectSavedAddress = (address: Address) => {
    setShipAddress(addressToFormData(address));
  };

  const handleSaveEditedAddress = async (data: AddressParams, id?: string) => {
    if (!id || !onUpdateSavedAddress) {
      throw new Error("Cannot update address");
    }

    const updatedAddress = await onUpdateSavedAddress(id, data);
    if (!updatedAddress) {
      throw new Error("Failed to update address");
    }

    setSavedAddresses((prev) =>
      prev.map((addr) => (addr.id === id ? updatedAddress : addr)),
    );
    handleSelectSavedAddress(updatedAddress);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Sign-in prompt for guests */}
        {!isAuthenticated && (
          <Alert role="status">
            <InfoIcon />
            <AlertDescription>
              Already have an account?
              <br />
              <Link href={signInUrl}>Sign in</Link> to access your saved
              addresses and order history.
            </AlertDescription>
          </Alert>
        )}

        {/* Contact Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Contact Information
          </h2>
          <Field>
            <FieldLabel htmlFor="email">Email address</FieldLabel>
            <Input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isAuthenticated}
              placeholder="you@example.com"
            />
            {isAuthenticated && (
              <FieldDescription>
                Using your account email address
              </FieldDescription>
            )}
          </Field>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
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
          <Button type="submit" disabled={processing}>
            {processing ? "Saving..." : "Continue to Delivery"}
          </Button>
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
