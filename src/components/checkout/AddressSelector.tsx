"use client"

import { useState, useEffect } from "react"
import type { StoreAddress, StoreCountry, StoreState } from "@spree/sdk"

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

interface AddressSelectorProps {
  savedAddresses: StoreAddress[]
  currentAddress: AddressFormData
  countries: StoreCountry[]
  states: StoreState[]
  loadingStates: boolean
  onChange: (field: keyof AddressFormData, value: string) => void
  onSelectSavedAddress: (address: StoreAddress) => void
  idPrefix: string
}

export function AddressSelector({
  savedAddresses,
  currentAddress,
  countries,
  states,
  loadingStates,
  onChange,
  onSelectSavedAddress,
  idPrefix,
}: AddressSelectorProps) {
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new")

  // Check if current address matches a saved address
  useEffect(() => {
    if (savedAddresses.length === 0) return

    const matchingAddress = savedAddresses.find(
      (addr) =>
        addr.address1 === currentAddress.address1 &&
        addr.city === currentAddress.city &&
        addr.zipcode === currentAddress.zipcode &&
        addr.country_iso === currentAddress.country_iso
    )

    if (matchingAddress) {
      setSelectedAddressId(matchingAddress.id)
    } else if (currentAddress.address1) {
      // If there's an address but it doesn't match saved ones, show as new
      setSelectedAddressId("new")
    }
  }, [savedAddresses]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectAddress = (addressId: string) => {
    setSelectedAddressId(addressId)

    if (addressId === "new") {
      // Clear form for new address
      onChange("firstname", "")
      onChange("lastname", "")
      onChange("address1", "")
      onChange("address2", "")
      onChange("city", "")
      onChange("zipcode", "")
      onChange("phone", "")
      onChange("company", "")
      onChange("country_iso", "")
      onChange("state_abbr", "")
      onChange("state_name", "")
    } else {
      const selectedAddress = savedAddresses.find((a) => a.id === addressId)
      if (selectedAddress) {
        onSelectSavedAddress(selectedAddress)
      }
    }
  }

  const hasStates = states.length > 0
  const showForm = selectedAddressId === "new" || savedAddresses.length === 0

  return (
    <div className="space-y-4">
      {/* Saved addresses selection */}
      {savedAddresses.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Select an address</p>
          <div className="grid gap-3">
            {savedAddresses.map((address) => (
              <label
                key={address.id}
                className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedAddressId === address.id
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name={`${idPrefix}-address-selection`}
                  value={address.id}
                  checked={selectedAddressId === address.id}
                  onChange={() => handleSelectAddress(address.id)}
                  className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{address.full_name}</p>
                  {address.company && (
                    <p className="text-sm text-gray-500">{address.company}</p>
                  )}
                  <p className="text-sm text-gray-500">{address.address1}</p>
                  {address.address2 && (
                    <p className="text-sm text-gray-500">{address.address2}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    {address.city}, {address.state_text || address.state_name} {address.zipcode}
                  </p>
                  <p className="text-sm text-gray-500">{address.country_name}</p>
                </div>
              </label>
            ))}
            <label
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedAddressId === "new"
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name={`${idPrefix}-address-selection`}
                value="new"
                checked={selectedAddressId === "new"}
                onChange={() => handleSelectAddress("new")}
                className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
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
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${savedAddresses.length > 0 ? "pt-4 border-t border-gray-200" : ""}`}>
          <div>
            <label htmlFor={`${idPrefix}-firstname`} className="block text-sm font-medium text-gray-700">
              First name
            </label>
            <input
              type="text"
              id={`${idPrefix}-firstname`}
              required
              value={currentAddress.firstname}
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
              value={currentAddress.lastname}
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
              value={currentAddress.company}
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
              value={currentAddress.address1}
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
              value={currentAddress.address2}
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
              value={currentAddress.city}
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
              value={currentAddress.country_iso}
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
                value={currentAddress.state_abbr}
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
                value={currentAddress.state_name}
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
              value={currentAddress.zipcode}
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
              value={currentAddress.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      )}
    </div>
  )
}
