"use client";

import type { Country, State } from "@spree/sdk";
import { useTranslations } from "next-intl";
import { Field, FieldLabel } from "@/components/ui/field";
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
  const t = useTranslations("address");
  const tc = useTranslations("common");
  const hasStates = states.length > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-firstname`}>
          {t("firstName")}
        </FieldLabel>
        <Input
          type="text"
          id={`${idPrefix}-firstname`}
          required
          value={address.firstname}
          onChange={(e) => onChange("firstname", e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-lastname`}>
          {t("lastName")}
        </FieldLabel>
        <Input
          type="text"
          id={`${idPrefix}-lastname`}
          required
          value={address.lastname}
          onChange={(e) => onChange("lastname", e.target.value)}
        />
      </Field>

      <Field className="sm:col-span-2">
        <FieldLabel htmlFor={`${idPrefix}-company`}>{t("company")}</FieldLabel>
        <Input
          type="text"
          id={`${idPrefix}-company`}
          value={address.company}
          onChange={(e) => onChange("company", e.target.value)}
        />
      </Field>

      <Field className="sm:col-span-2">
        <FieldLabel htmlFor={`${idPrefix}-address1`}>
          {t("streetAddress")}
        </FieldLabel>
        <Input
          type="text"
          id={`${idPrefix}-address1`}
          required
          value={address.address1}
          onChange={(e) => onChange("address1", e.target.value)}
          placeholder={t("streetAddress")}
        />
      </Field>

      <Field className="sm:col-span-2">
        <FieldLabel htmlFor={`${idPrefix}-address2`}>
          {t("apartment")}
        </FieldLabel>
        <Input
          type="text"
          id={`${idPrefix}-address2`}
          value={address.address2}
          onChange={(e) => onChange("address2", e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-city`}>{t("city")}</FieldLabel>
        <Input
          type="text"
          id={`${idPrefix}-city`}
          required
          value={address.city}
          onChange={(e) => onChange("city", e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-country`}>{t("country")}</FieldLabel>
        <NativeSelect
          id={`${idPrefix}-country`}
          className="w-full"
          value={address.country_iso}
          onChange={(e) => onChange("country_iso", e.target.value)}
          required
        >
          <NativeSelectOption value="" disabled>
            {t("selectCountry")}
          </NativeSelectOption>
          {countries.map((country) => (
            <NativeSelectOption key={country.iso} value={country.iso}>
              {country.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-state`}>
          {t("stateProvince")}
        </FieldLabel>
        {loadingStates ? (
          <NativeSelect id={`${idPrefix}-state`} className="w-full" disabled>
            <NativeSelectOption value="">{tc("loading")}</NativeSelectOption>
          </NativeSelect>
        ) : hasStates ? (
          <NativeSelect
            id={`${idPrefix}-state`}
            className="w-full"
            value={address.state_abbr}
            onChange={(e) => onChange("state_abbr", e.target.value)}
            required
          >
            <NativeSelectOption value="" disabled>
              {t("selectState")}
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
            value={address.state_name}
            onChange={(e) => onChange("state_name", e.target.value)}
            placeholder={t("stateOrProvince")}
          />
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-zipcode`}>{t("zipCode")}</FieldLabel>
        <Input
          type="text"
          id={`${idPrefix}-zipcode`}
          required
          value={address.zipcode}
          onChange={(e) => onChange("zipcode", e.target.value)}
        />
      </Field>

      <Field className="sm:col-span-2">
        <FieldLabel htmlFor={`${idPrefix}-phone`}>{t("phone")}</FieldLabel>
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
