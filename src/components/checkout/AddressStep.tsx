"use client"

import { useState, useEffect, useTransition } from "react"
import type { StoreOrder, StoreCountry, StoreState, AddressParams } from "@spree/sdk"

interface AddressStepProps {
  order: StoreOrder
  countries: StoreCountry[]
  fetchStates: (countryIso: string) => Promise<StoreState[]>
  onSubmit: (data: {
    email: string
    ship_address: AddressParams
    bill_address?: AddressParams
    use_shipping_for_billing: boolean
  }) => Promise<void>
  processing: boolean
}

interface AddressFormData {
  firstname: string
  lastname: string
  address1: string
  address2: string
  city: string
  zipcode: string
  phone: string
  company: string
  country_iso: string
  state_abbr: string
  state_name: string
}

const emptyAddress: AddressFormData = {
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
}

function addressToFormData(address?: {
  firstname: string | null
  lastname: string | null
  address1: string | null
  address2: string | null
  city: string | null
  zipcode: string | null
  phone: string | null
  company: string | null
  country_iso: string
  state_abbr: string | null
  state_name: string | null
}): AddressFormData {
  if (!address) return emptyAddress
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
  }
}

function formDataToAddress(data: AddressFormData): AddressParams {
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
  }
}

export function AddressStep({
  order,
  countries,
  fetchStates,
  onSubmit,
  processing,
}: AddressStepProps) {
  const [email, setEmail] = useState(order.email || "")
  const [shipAddress, setShipAddress] = useState<AddressFormData>(() =>
    addressToFormData(order.ship_address)
  )
  const [billAddress, setBillAddress] = useState<AddressFormData>(() =>
    addressToFormData(order.bill_address)
  )
  const [useShippingForBilling, setUseShippingForBilling] = useState(true)
  const [shipStates, setShipStates] = useState<StoreState[]>([])
  const [billStates, setBillStates] = useState<StoreState[]>([])
  const [isPendingShip, startTransitionShip] = useTransition()
  const [isPendingBill, startTransitionBill] = useTransition()

  // Load states when shipping country changes
  useEffect(() => {
    if (!shipAddress.country_iso) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShipStates([])
      return
    }

    let cancelled = false

    startTransitionShip(() => {
      fetchStates(shipAddress.country_iso).then((states) => {
        if (!cancelled) {
          setShipStates(states)
        }
      })
    })

    return () => {
      cancelled = true
    }
  }, [shipAddress.country_iso, fetchStates])

  // Load states when billing country changes
  useEffect(() => {
    if (useShippingForBilling || !billAddress.country_iso) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBillStates([])
      return
    }

    let cancelled = false

    startTransitionBill(() => {
      fetchStates(billAddress.country_iso).then((states) => {
        if (!cancelled) {
          setBillStates(states)
        }
      })
    })

    return () => {
      cancelled = true
    }
  }, [billAddress.country_iso, useShippingForBilling, fetchStates])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      email,
      ship_address: formDataToAddress(shipAddress),
      bill_address: useShippingForBilling ? undefined : formDataToAddress(billAddress),
      use_shipping_for_billing: useShippingForBilling,
    })
  }

  const updateShipAddress = (field: keyof AddressFormData, value: string) => {
    setShipAddress((prev) => {
      const updated = { ...prev, [field]: value }
      // Clear state when country changes
      if (field === "country_iso") {
        updated.state_abbr = ""
        updated.state_name = ""
      }
      return updated
    })
  }

  const updateBillAddress = (field: keyof AddressFormData, value: string) => {
    setBillAddress((prev) => {
      const updated = { ...prev, [field]: value }
      // Clear state when country changes
      if (field === "country_iso") {
        updated.state_abbr = ""
        updated.state_name = ""
      }
      return updated
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Contact Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            type="email"
            id="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
        <AddressForm
          address={shipAddress}
          countries={countries}
          states={shipStates}
          loadingStates={isPendingShip}
          onChange={updateShipAddress}
          idPrefix="ship"
        />
      </div>

      {/* Billing Address */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing Address</h2>
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useShippingForBilling}
              onChange={(e) => setUseShippingForBilling(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-600">Same as shipping address</span>
          </label>
        </div>

        {!useShippingForBilling && (
          <AddressForm
            address={billAddress}
            countries={countries}
            states={billStates}
            loadingStates={isPendingBill}
            onChange={updateBillAddress}
            idPrefix="bill"
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
  )
}

interface AddressFormProps {
  address: AddressFormData
  countries: StoreCountry[]
  states: StoreState[]
  loadingStates: boolean
  onChange: (field: keyof AddressFormData, value: string) => void
  idPrefix: string
}

function AddressForm({
  address,
  countries,
  states,
  loadingStates,
  onChange,
  idPrefix,
}: AddressFormProps) {
  const hasStates = states.length > 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label htmlFor={`${idPrefix}-firstname`} className="block text-sm font-medium text-gray-700">
          First name
        </label>
        <input
          type="text"
          id={`${idPrefix}-firstname`}
          required
          value={address.firstname}
          onChange={(e) => onChange("firstname", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-lastname`} className="block text-sm font-medium text-gray-700">
          Last name
        </label>
        <input
          type="text"
          id={`${idPrefix}-lastname`}
          required
          value={address.lastname}
          onChange={(e) => onChange("lastname", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-company`} className="block text-sm font-medium text-gray-700">
          Company (optional)
        </label>
        <input
          type="text"
          id={`${idPrefix}-company`}
          value={address.company}
          onChange={(e) => onChange("company", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-address1`} className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <input
          type="text"
          id={`${idPrefix}-address1`}
          required
          value={address.address1}
          onChange={(e) => onChange("address1", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Street address"
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-address2`} className="block text-sm font-medium text-gray-700">
          Apartment, suite, etc. (optional)
        </label>
        <input
          type="text"
          id={`${idPrefix}-address2`}
          value={address.address2}
          onChange={(e) => onChange("address2", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-city`} className="block text-sm font-medium text-gray-700">
          City
        </label>
        <input
          type="text"
          id={`${idPrefix}-city`}
          required
          value={address.city}
          onChange={(e) => onChange("city", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-country`} className="block text-sm font-medium text-gray-700">
          Country
        </label>
        <select
          id={`${idPrefix}-country`}
          required
          value={address.country_iso}
          onChange={(e) => onChange("country_iso", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
        <label htmlFor={`${idPrefix}-state`} className="block text-sm font-medium text-gray-700">
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
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="State or province"
          />
        )}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-zipcode`} className="block text-sm font-medium text-gray-700">
          ZIP / Postal code
        </label>
        <input
          type="text"
          id={`${idPrefix}-zipcode`}
          required
          value={address.zipcode}
          onChange={(e) => onChange("zipcode", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-phone`} className="block text-sm font-medium text-gray-700">
          Phone (optional)
        </label>
        <input
          type="tel"
          id={`${idPrefix}-phone`}
          value={address.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>
    </div>
  )
}
