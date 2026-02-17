"use client";

import type { StoreCountry, StoreState } from "@spree/sdk";
import type { AddressFormData } from "@/lib/utils/address";

interface AddressFormFieldsProps {
  address: AddressFormData;
  countries: StoreCountry[];
  states: StoreState[];
  loadingStates: boolean;
  onChange: (field: keyof AddressFormData, value: string) => void;
  idPrefix: string;
}

export function AddressFormFields({
  address,
  countries,
  states,
  loadingStates,
  onChange,
  idPrefix,
}: AddressFormFieldsProps) {
  const hasStates = states.length > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label
          htmlFor={`${idPrefix}-firstname`}
          className="block text-sm font-medium text-gray-700"
        >
          First name
        </label>
        <input
          type="text"
          id={`${idPrefix}-firstname`}
          required
          value={address.firstname}
          onChange={(e) => onChange("firstname", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-lastname`}
          className="block text-sm font-medium text-gray-700"
        >
          Last name
        </label>
        <input
          type="text"
          id={`${idPrefix}-lastname`}
          required
          value={address.lastname}
          onChange={(e) => onChange("lastname", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="sm:col-span-2">
        <label
          htmlFor={`${idPrefix}-company`}
          className="block text-sm font-medium text-gray-700"
        >
          Company (optional)
        </label>
        <input
          type="text"
          id={`${idPrefix}-company`}
          value={address.company}
          onChange={(e) => onChange("company", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="sm:col-span-2">
        <label
          htmlFor={`${idPrefix}-address1`}
          className="block text-sm font-medium text-gray-700"
        >
          Address
        </label>
        <input
          type="text"
          id={`${idPrefix}-address1`}
          required
          value={address.address1}
          onChange={(e) => onChange("address1", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Street address"
        />
      </div>

      <div className="sm:col-span-2">
        <label
          htmlFor={`${idPrefix}-address2`}
          className="block text-sm font-medium text-gray-700"
        >
          Apartment, suite, etc. (optional)
        </label>
        <input
          type="text"
          id={`${idPrefix}-address2`}
          value={address.address2}
          onChange={(e) => onChange("address2", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-city`}
          className="block text-sm font-medium text-gray-700"
        >
          City
        </label>
        <input
          type="text"
          id={`${idPrefix}-city`}
          required
          value={address.city}
          onChange={(e) => onChange("city", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-country`}
          className="block text-sm font-medium text-gray-700"
        >
          Country
        </label>
        <select
          id={`${idPrefix}-country`}
          required
          value={address.country_iso}
          onChange={(e) => onChange("country_iso", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Select a country</option>
          {countries.map((country) => (
            <option key={country.iso} value={country.iso}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-state`}
          className="block text-sm font-medium text-gray-700"
        >
          State / Province
        </label>
        {loadingStates ? (
          <div className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-400">
            Loading...
          </div>
        ) : hasStates ? (
          <select
            id={`${idPrefix}-state`}
            required
            value={address.state_abbr}
            onChange={(e) => onChange("state_abbr", e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Select a state</option>
            {states.map((state) => (
              <option key={state.abbr} value={state.abbr}>
                {state.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            id={`${idPrefix}-state`}
            value={address.state_name}
            onChange={(e) => onChange("state_name", e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="State or province"
          />
        )}
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-zipcode`}
          className="block text-sm font-medium text-gray-700"
        >
          ZIP / Postal code
        </label>
        <input
          type="text"
          id={`${idPrefix}-zipcode`}
          required
          value={address.zipcode}
          onChange={(e) => onChange("zipcode", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="sm:col-span-2">
        <label
          htmlFor={`${idPrefix}-phone`}
          className="block text-sm font-medium text-gray-700"
        >
          Phone (optional)
        </label>
        <input
          type="tel"
          id={`${idPrefix}-phone`}
          value={address.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}
