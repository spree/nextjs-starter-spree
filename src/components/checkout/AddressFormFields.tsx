"use client";

import type { Country, State } from "@spree/sdk";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import type { AddressFormData } from "@/lib/utils/address";

interface AddressFormFieldsProps {
  address: AddressFormData;
  countries: Country[];
  states: State[];
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
    <div className="flex flex-col gap-3">
      {/* Country — full width, floating label style */}
      <div className="relative">
        <NativeSelect
          id={`${idPrefix}-country`}
          aria-label="Country/Region"
          className="w-full"
          value={address.country_iso}
          onChange={(e) => onChange("country_iso", e.target.value)}
          required
        >
          <NativeSelectOption value="" disabled>
            Country/Region
          </NativeSelectOption>
          {countries.map((country) => (
            <NativeSelectOption key={country.iso} value={country.iso}>
              {country.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {/* First name / Last name */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="text"
          id={`${idPrefix}-firstname`}
          aria-label="First name"
          value={address.firstname}
          onChange={(e) => onChange("firstname", e.target.value)}
          placeholder="First name (optional)"
        />
        <Input
          type="text"
          id={`${idPrefix}-lastname`}
          aria-label="Last name"
          required
          value={address.lastname}
          onChange={(e) => onChange("lastname", e.target.value)}
          placeholder="Last name"
        />
      </div>

      {/* Company */}
      <Input
        type="text"
        id={`${idPrefix}-company`}
        aria-label="Company"
        value={address.company}
        onChange={(e) => onChange("company", e.target.value)}
        placeholder="Company (optional)"
      />

      {/* Address */}
      <Input
        type="text"
        id={`${idPrefix}-address1`}
        aria-label="Address"
        required
        value={address.address1}
        onChange={(e) => onChange("address1", e.target.value)}
        placeholder="Address"
      />

      {/* Apartment */}
      <Input
        type="text"
        id={`${idPrefix}-address2`}
        aria-label="Apartment, suite, etc."
        value={address.address2}
        onChange={(e) => onChange("address2", e.target.value)}
        placeholder="Apartment, suite, etc. (optional)"
      />

      {/* City / State / ZIP — 3 columns */}
      <div className="grid grid-cols-3 gap-3">
        <Input
          type="text"
          id={`${idPrefix}-city`}
          aria-label="City"
          required
          value={address.city}
          onChange={(e) => onChange("city", e.target.value)}
          placeholder="City"
        />
        {loadingStates ? (
          <NativeSelect
            id={`${idPrefix}-state`}
            aria-label="State"
            className="w-full"
            disabled
          >
            <NativeSelectOption value="">Loading...</NativeSelectOption>
          </NativeSelect>
        ) : hasStates ? (
          <NativeSelect
            id={`${idPrefix}-state`}
            aria-label="State"
            className="w-full"
            value={address.state_abbr}
            onChange={(e) => onChange("state_abbr", e.target.value)}
            required
          >
            <NativeSelectOption value="" disabled>
              State
            </NativeSelectOption>
            {states.map((state) => (
              <NativeSelectOption key={state.abbr} value={state.abbr}>
                {state.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        ) : (
          <Input
            type="text"
            id={`${idPrefix}-state`}
            aria-label="State"
            value={address.state_name}
            onChange={(e) => onChange("state_name", e.target.value)}
            placeholder="State"
          />
        )}
        <Input
          type="text"
          id={`${idPrefix}-zipcode`}
          aria-label="ZIP code"
          required
          value={address.zipcode}
          onChange={(e) => onChange("zipcode", e.target.value)}
          placeholder="ZIP code"
        />
      </div>

      {/* Phone */}
      <Input
        type="tel"
        id={`${idPrefix}-phone`}
        aria-label="Phone"
        value={address.phone}
        onChange={(e) => onChange("phone", e.target.value)}
        placeholder="Phone (optional)"
      />
    </div>
  );
}
