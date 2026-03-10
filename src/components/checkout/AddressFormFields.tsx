"use client";

import type { Country, State } from "@spree/sdk";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-firstname`}>First name</FieldLabel>
        <Input
          type="text"
          id={`${idPrefix}-firstname`}
          required
          value={address.firstname}
          onChange={(e) => onChange("firstname", e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-lastname`}>Last name</FieldLabel>
        <Input
          type="text"
          id={`${idPrefix}-lastname`}
          required
          value={address.lastname}
          onChange={(e) => onChange("lastname", e.target.value)}
        />
      </Field>

      <Field className="sm:col-span-2">
        <FieldLabel htmlFor={`${idPrefix}-company`}>
          Company (optional)
        </FieldLabel>
        <Input
          type="text"
          id={`${idPrefix}-company`}
          value={address.company}
          onChange={(e) => onChange("company", e.target.value)}
        />
      </Field>

      <Field className="sm:col-span-2">
        <FieldLabel htmlFor={`${idPrefix}-address1`}>Address</FieldLabel>
        <Input
          type="text"
          id={`${idPrefix}-address1`}
          required
          value={address.address1}
          onChange={(e) => onChange("address1", e.target.value)}
          placeholder="Street address"
        />
      </Field>

      <Field className="sm:col-span-2">
        <FieldLabel htmlFor={`${idPrefix}-address2`}>
          Apartment, suite, etc. (optional)
        </FieldLabel>
        <Input
          type="text"
          id={`${idPrefix}-address2`}
          value={address.address2}
          onChange={(e) => onChange("address2", e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-city`}>City</FieldLabel>
        <Input
          type="text"
          id={`${idPrefix}-city`}
          required
          value={address.city}
          onChange={(e) => onChange("city", e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-country`}>Country</FieldLabel>
        <Select
          value={address.country_iso || undefined}
          onValueChange={(value) => onChange("country_iso", value)}
          required
        >
          <SelectTrigger id={`${idPrefix}-country`} className="w-full">
            <SelectValue placeholder="Select a country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.iso} value={country.iso}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-state`}>State / Province</FieldLabel>
        {loadingStates ? (
          <Select disabled>
            <SelectTrigger id={`${idPrefix}-state`} className="w-full">
              <SelectValue placeholder="Loading..." />
            </SelectTrigger>
            <SelectContent />
          </Select>
        ) : hasStates ? (
          <Select
            value={address.state_abbr || undefined}
            onValueChange={(value) => onChange("state_abbr", value)}
            required
          >
            <SelectTrigger id={`${idPrefix}-state`} className="w-full">
              <SelectValue placeholder="Select a state" />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state.abbr} value={state.abbr}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            type="text"
            id={`${idPrefix}-state`}
            value={address.state_name}
            onChange={(e) => onChange("state_name", e.target.value)}
            placeholder="State or province"
          />
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-zipcode`}>
          ZIP / Postal code
        </FieldLabel>
        <Input
          type="text"
          id={`${idPrefix}-zipcode`}
          required
          value={address.zipcode}
          onChange={(e) => onChange("zipcode", e.target.value)}
        />
      </Field>

      <Field className="sm:col-span-2">
        <FieldLabel htmlFor={`${idPrefix}-phone`}>Phone (optional)</FieldLabel>
        <Input
          type="tel"
          id={`${idPrefix}-phone`}
          value={address.phone}
          onChange={(e) => onChange("phone", e.target.value)}
        />
      </Field>
    </div>
  );
}
