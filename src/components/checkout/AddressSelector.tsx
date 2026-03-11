"use client";

import type { Address, Country, State } from "@spree/sdk";
import { Button } from "@/components/ui/button";
import type { AddressFormData } from "@/lib/utils/address";
import { AddressFormFields } from "./AddressFormFields";

interface AddressSelectorProps {
  savedAddresses: Address[];
  selectedAddressId: string | null;
  currentAddress: AddressFormData;
  countries: Country[];
  states: State[];
  loadingStates: boolean;
  onChange: (field: keyof AddressFormData, value: string) => void;
  onSelectSavedAddress: (address: Address) => void;
  onSelectNew: () => void;
  onEditAddress?: (address: Address) => void;
  idPrefix: string;
}

export function AddressSelector({
  savedAddresses,
  selectedAddressId,
  currentAddress,
  countries,
  states,
  loadingStates,
  onChange,
  onSelectSavedAddress,
  onSelectNew,
  onEditAddress,
  idPrefix,
}: AddressSelectorProps) {
  const showForm = !selectedAddressId || savedAddresses.length === 0;

  return (
    <div className="space-y-4">
      {/* Saved addresses selection */}
      {savedAddresses.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Select an address</p>
          <div className="grid gap-3">
            {savedAddresses.map((address) => (
              <div
                key={address.id}
                className={`flex items-start p-4 border rounded-xl transition-colors ${
                  selectedAddressId === address.id
                    ? "border-gray-300 bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <label className="flex items-start flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name={`${idPrefix}-address-selection`}
                    value={address.id}
                    checked={selectedAddressId === address.id}
                    onChange={() => onSelectSavedAddress(address)}
                    className="mt-1 h-4 w-4 text-primary border-gray-300"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {address.full_name}
                    </p>
                    {address.company && (
                      <p className="text-sm text-gray-500">{address.company}</p>
                    )}
                    <p className="text-sm text-gray-500">{address.address1}</p>
                    {address.address2 && (
                      <p className="text-sm text-gray-500">
                        {address.address2}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      {address.city}, {address.state_text || address.state_name}{" "}
                      {address.zipcode}
                    </p>
                    <p className="text-sm text-gray-500">
                      {address.country_name}
                    </p>
                  </div>
                </label>
                {onEditAddress && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      onEditAddress(address);
                    }}
                  >
                    Edit
                  </Button>
                )}
              </div>
            ))}
            <label
              className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${
                !selectedAddressId
                  ? "border-gray-300 bg-gray-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name={`${idPrefix}-address-selection`}
                value="new"
                checked={!selectedAddressId}
                onChange={onSelectNew}
                className="h-4 w-4 text-primary border-gray-300"
              />
              <span className="ml-3 text-sm font-medium text-gray-900">
                Use a different address
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Address form (shown when "new" is selected or no saved addresses) */}
      {showForm && (
        <div
          className={
            savedAddresses.length > 0
              ? "pt-4 border-t border-gray-200"
              : undefined
          }
        >
          <AddressFormFields
            address={currentAddress}
            countries={countries}
            states={states}
            loadingStates={loadingStates}
            onChange={onChange}
            idPrefix={idPrefix}
          />
        </div>
      )}
    </div>
  );
}
