import type { AddressParams } from "@spree/sdk";

export interface AddressFormData {
  firstname: string;
  lastname: string;
  address1: string;
  address2: string;
  city: string;
  zipcode: string;
  phone: string;
  company: string;
  country_iso: string;
  state_abbr: string;
  state_name: string;
}

export const emptyAddress: AddressFormData = {
  firstname: "",
  lastname: "",
  address1: "",
  address2: "",
  city: "",
  zipcode: "",
  phone: "",
  company: "",
  country_iso: "",
  state_abbr: "",
  state_name: "",
};

export function addressToFormData(
  address?: {
    firstname: string | null;
    lastname: string | null;
    address1: string | null;
    address2: string | null;
    city: string | null;
    zipcode: string | null;
    phone: string | null;
    company: string | null;
    country_iso: string;
    state_abbr: string | null;
    state_name: string | null;
  } | null,
): AddressFormData {
  if (!address) return { ...emptyAddress };
  return {
    firstname: address.firstname || "",
    lastname: address.lastname || "",
    address1: address.address1 || "",
    address2: address.address2 || "",
    city: address.city || "",
    zipcode: address.zipcode || "",
    phone: address.phone || "",
    company: address.company || "",
    country_iso: address.country_iso || "",
    state_abbr: address.state_abbr || "",
    state_name: address.state_name || "",
  };
}

export function formDataToAddress(data: AddressFormData): AddressParams {
  return {
    firstname: data.firstname,
    lastname: data.lastname,
    address1: data.address1,
    address2: data.address2 || undefined,
    city: data.city,
    zipcode: data.zipcode,
    phone: data.phone || undefined,
    company: data.company || undefined,
    country_iso: data.country_iso,
    state_abbr: data.state_abbr || undefined,
    state_name: data.state_name || undefined,
  };
}

export function addressesMatch(
  a: AddressFormData | undefined | null,
  b:
    | {
        firstname: string | null;
        lastname: string | null;
        address1: string | null;
        city: string | null;
        zipcode: string | null;
        country_iso: string;
      }
    | undefined
    | null,
): boolean {
  if (!a || !b) return false;
  return (
    a.firstname === (b.firstname || "") &&
    a.lastname === (b.lastname || "") &&
    a.address1 === (b.address1 || "") &&
    a.city === (b.city || "") &&
    a.zipcode === (b.zipcode || "") &&
    a.country_iso === b.country_iso
  );
}
