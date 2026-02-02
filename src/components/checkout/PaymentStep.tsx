"use client"

import { useState, useEffect, useTransition } from "react"
import type { StoreOrder, StoreCountry, StoreState, AddressParams } from "@spree/sdk"

interface PaymentStepProps {
  order: StoreOrder
  countries: StoreCountry[]
  fetchStates: (countryIso: string) => Promise<StoreState[]>
  onSubmit: (data: {
    bill_address: AddressParams
    use_shipping_for_billing: boolean
  }) => Promise<void>
  onBack: () => void
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

// Check if two addresses are the same
function addressesMatch(
  a: AddressFormData | undefined,
  b: { firstname: string | null; lastname: string | null; address1: string | null; city: string | null; zipcode: string | null; country_iso: string } | undefined
): boolean {
  if (!a || !b) return false
  return (
    a.firstname === (b.firstname || "") &&
    a.lastname === (b.lastname || "") &&
    a.address1 === (b.address1 || "") &&
    a.city === (b.city || "") &&
    a.zipcode === (b.zipcode || "") &&
    a.country_iso === b.country_iso
  )
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
  const shipAddressData = addressToFormData(order.ship_address)
  const billAddressData = addressToFormData(order.bill_address)
  const initialUseShipping = !order.bill_address || addressesMatch(shipAddressData, order.bill_address)

  const [billAddress, setBillAddress] = useState<AddressFormData>(
    initialUseShipping ? shipAddressData : billAddressData
  )
  const [useShippingForBilling, setUseShippingForBilling] = useState(initialUseShipping)
  const [billStates, setBillStates] = useState<StoreState[]>([])
  const [isPendingBill, startTransitionBill] = useTransition()

  // Load states when billing country changes
  useEffect(() => {
    if (useShippingForBilling || !billAddress.country_iso) {
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

  // When "use shipping" changes, reset billing address
  useEffect(() => {
    if (useShippingForBilling) {
      setBillAddress(shipAddressData)
    }
  }, [useShippingForBilling]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      bill_address: formDataToAddress(useShippingForBilling ? shipAddressData : billAddress),
      use_shipping_for_billing: useShippingForBilling,
    })
  }

  const updateBillAddress = (field: keyof AddressFormData, value: string) => {
    setBillAddress((prev) => {
      const updated = { ...prev, [field]: value }
      if (field === "country_iso") {
        updated.state_abbr = ""
        updated.state_name = ""
      }
      return updated
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Shipping Address Summary */}
      {order.ship_address && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Edit
            </button>
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900">{order.ship_address.full_name}</p>
            {order.ship_address.company && <p>{order.ship_address.company}</p>}
            <p>{order.ship_address.address1}</p>
            {order.ship_address.address2 && <p>{order.ship_address.address2}</p>}
            <p>
              {order.ship_address.city}, {order.ship_address.state_text || order.ship_address.state_name}{" "}
              {order.ship_address.zipcode}
            </p>
            <p>{order.ship_address.country_name}</p>
          </div>
        </div>
      )}

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
          <BillingAddressForm
            address={billAddress}
            countries={countries}
            states={billStates}
            loadingStates={isPendingBill}
            onChange={updateBillAddress}
          />
        )}
      </div>

      {/* Payment Methods - Placeholder */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
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
          <p className="text-gray-500">Payment methods will be available soon.</p>
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
  )
}

interface BillingAddressFormProps {
  address: AddressFormData
  countries: StoreCountry[]
  states: StoreState[]
  loadingStates: boolean
  onChange: (field: keyof AddressFormData, value: string) => void
}

function BillingAddressForm({
  address,
  countries,
  states,
  loadingStates,
  onChange,
}: BillingAddressFormProps) {
  const hasStates = states.length > 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label htmlFor="bill-firstname" className="block text-sm font-medium text-gray-700">
          First name
        </label>
        <input
          type="text"
          id="bill-firstname"
          required
          value={address.firstname}
          onChange={(e) => onChange("firstname", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="bill-lastname" className="block text-sm font-medium text-gray-700">
          Last name
        </label>
        <input
          type="text"
          id="bill-lastname"
          required
          value={address.lastname}
          onChange={(e) => onChange("lastname", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="bill-company" className="block text-sm font-medium text-gray-700">
          Company (optional)
        </label>
        <input
          type="text"
          id="bill-company"
          value={address.company}
          onChange={(e) => onChange("company", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="bill-address1" className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <input
          type="text"
          id="bill-address1"
          required
          value={address.address1}
          onChange={(e) => onChange("address1", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Street address"
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="bill-address2" className="block text-sm font-medium text-gray-700">
          Apartment, suite, etc. (optional)
        </label>
        <input
          type="text"
          id="bill-address2"
          value={address.address2}
          onChange={(e) => onChange("address2", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="bill-city" className="block text-sm font-medium text-gray-700">
          City
        </label>
        <input
          type="text"
          id="bill-city"
          required
          value={address.city}
          onChange={(e) => onChange("city", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="bill-country" className="block text-sm font-medium text-gray-700">
          Country
        </label>
        <select
          id="bill-country"
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
        <label htmlFor="bill-state" className="block text-sm font-medium text-gray-700">
          State / Province
        </label>
        {loadingStates ? (
          <div className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-400">
            Loading...
          </div>
        ) : hasStates ? (
          <select
            id="bill-state"
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
            id="bill-state"
            value={address.state_name}
            onChange={(e) => onChange("state_name", e.target.value)}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="State or province"
          />
        )}
      </div>

      <div>
        <label htmlFor="bill-zipcode" className="block text-sm font-medium text-gray-700">
          ZIP / Postal code
        </label>
        <input
          type="text"
          id="bill-zipcode"
          required
          value={address.zipcode}
          onChange={(e) => onChange("zipcode", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="bill-phone" className="block text-sm font-medium text-gray-700">
          Phone (optional)
        </label>
        <input
          type="tel"
          id="bill-phone"
          value={address.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>
    </div>
  )
}
