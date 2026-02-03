"use client";

import type {
  AddressParams,
  StoreAddress,
  StoreCountry,
  StoreOrder,
  StoreState,
} from "@spree/sdk";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { AddressSelector } from "./AddressSelector";

interface AddressStepProps {
  order: StoreOrder;
  countries: StoreCountry[];
  savedAddresses: StoreAddress[];
  isAuthenticated: boolean;
  signInUrl: string;
  fetchStates: (countryIso: string) => Promise<StoreState[]>;
  onSubmit: (data: {
    email: string;
    ship_address?: AddressParams;
    ship_address_id?: string;
  }) => Promise<void>;
  onUpdateSavedAddress?: (
    id: string,
    data: AddressParams,
  ) => Promise<StoreAddress | null>;
  processing: boolean;
}

interface AddressFormData {
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
};

function addressToFormData(address?: {
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
}): AddressFormData {
  if (!address) return emptyAddress;
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
  };
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
  const [shipStates, setShipStates] = useState<StoreState[]>([]);
  const [isPendingShip, startTransitionShip] = useTransition();
  const [savedAddresses, setSavedAddresses] = useState(initialSavedAddresses);
  const [editingAddress, setEditingAddress] = useState<StoreAddress | null>(
    null,
  );
  const [editModalStates, setEditModalStates] = useState<StoreState[]>([]);
  const [editModalLoading, setEditModalLoading] = useState(false);
  const [editModalSaving, setEditModalSaving] = useState(false);
  const [editModalError, setEditModalError] = useState("");

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

  const handleSelectSavedAddress = (address: StoreAddress) => {
    setShipAddress({
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
    });
  };

  const handleEditAddress = async (address: StoreAddress) => {
    setEditingAddress(address);
    setEditModalError("");
    setEditModalStates([]);

    if (address.country_iso) {
      setEditModalLoading(true);
      try {
        const states = await fetchStates(address.country_iso);
        setEditModalStates(states);
      } finally {
        setEditModalLoading(false);
      }
    }
  };

  const handleEditModalCountryChange = async (countryIso: string) => {
    if (!editingAddress) return;

    setEditingAddress({
      ...editingAddress,
      country_iso: countryIso,
      state_abbr: null,
      state_name: null,
    });

    if (countryIso) {
      setEditModalLoading(true);
      try {
        const states = await fetchStates(countryIso);
        setEditModalStates(states);
      } finally {
        setEditModalLoading(false);
      }
    } else {
      setEditModalStates([]);
    }
  };

  const handleSaveEditedAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddress || !onUpdateSavedAddress) return;

    setEditModalSaving(true);
    setEditModalError("");

    try {
      const addressData: AddressParams = {
        firstname: editingAddress.firstname || "",
        lastname: editingAddress.lastname || "",
        address1: editingAddress.address1 || "",
        address2: editingAddress.address2 || undefined,
        city: editingAddress.city || "",
        zipcode: editingAddress.zipcode || "",
        phone: editingAddress.phone || undefined,
        company: editingAddress.company || undefined,
        country_iso: editingAddress.country_iso,
        state_abbr: editingAddress.state_abbr || undefined,
        state_name: editingAddress.state_name || undefined,
      };

      const updatedAddress = await onUpdateSavedAddress(
        editingAddress.id,
        addressData,
      );
      if (updatedAddress) {
        // Update local state with the returned address
        setSavedAddresses((prev) =>
          prev.map((addr) =>
            addr.id === editingAddress.id ? updatedAddress : addr,
          ),
        );
        // Also update the form if this address was selected
        handleSelectSavedAddress(updatedAddress);
        setEditingAddress(null);
      }
    } catch (err) {
      setEditModalError(
        err instanceof Error ? err.message : "Failed to update address",
      );
    } finally {
      setEditModalSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Sign-in prompt for guests */}
      {!isAuthenticated && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Already have an account?{" "}
            <Link
              href={signInUrl}
              className="font-medium text-blue-600 hover:text-blue-700 underline"
            >
              Sign in
            </Link>{" "}
            to access your saved addresses and order history.
          </p>
        </div>
      )}

      {/* Contact Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Contact Information
        </h2>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email address
          </label>
          <input
            type="email"
            id="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isAuthenticated}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="you@example.com"
          />
          {isAuthenticated && (
            <p className="mt-1 text-xs text-gray-500">
              Using your account email address
            </p>
          )}
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
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
            onEditAddress={onUpdateSavedAddress ? handleEditAddress : undefined}
            idPrefix="ship"
          />
        ) : (
          <AddressForm
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
        <button
          type="submit"
          disabled={processing}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? "Saving..." : "Continue to Delivery"}
        </button>
      </div>

      {/* Edit Address Modal */}
      {editingAddress && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 opacity-50 transition-opacity"
              onClick={() => setEditingAddress(null)}
            />

            <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSaveEditedAddress}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Edit Address
                  </h3>

                  {editModalError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {editModalError}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          First Name
                        </label>
                        <input
                          type="text"
                          required
                          value={editingAddress.firstname || ""}
                          onChange={(e) =>
                            setEditingAddress({
                              ...editingAddress,
                              firstname: e.target.value,
                            })
                          }
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Last Name
                        </label>
                        <input
                          type="text"
                          required
                          value={editingAddress.lastname || ""}
                          onChange={(e) =>
                            setEditingAddress({
                              ...editingAddress,
                              lastname: e.target.value,
                            })
                          }
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Company (optional)
                      </label>
                      <input
                        type="text"
                        value={editingAddress.company || ""}
                        onChange={(e) =>
                          setEditingAddress({
                            ...editingAddress,
                            company: e.target.value,
                          })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        required
                        value={editingAddress.address1 || ""}
                        onChange={(e) =>
                          setEditingAddress({
                            ...editingAddress,
                            address1: e.target.value,
                          })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Address Line 2 (optional)
                      </label>
                      <input
                        type="text"
                        value={editingAddress.address2 || ""}
                        onChange={(e) =>
                          setEditingAddress({
                            ...editingAddress,
                            address2: e.target.value,
                          })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Country
                      </label>
                      <select
                        required
                        value={editingAddress.country_iso}
                        onChange={(e) =>
                          handleEditModalCountryChange(e.target.value)
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      >
                        <option value="">Select a country</option>
                        {countries.map((country) => (
                          <option key={country.iso} value={country.iso}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          City
                        </label>
                        <input
                          type="text"
                          required
                          value={editingAddress.city || ""}
                          onChange={(e) =>
                            setEditingAddress({
                              ...editingAddress,
                              city: e.target.value,
                            })
                          }
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {editModalStates.length > 0
                            ? "State"
                            : "State/Region"}
                        </label>
                        {editModalLoading ? (
                          <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-400 text-sm">
                            Loading...
                          </div>
                        ) : editModalStates.length > 0 ? (
                          <select
                            value={editingAddress.state_abbr || ""}
                            onChange={(e) =>
                              setEditingAddress({
                                ...editingAddress,
                                state_abbr: e.target.value,
                              })
                            }
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                          >
                            <option value="">Select state</option>
                            {editModalStates.map((state) => (
                              <option key={state.abbr} value={state.abbr}>
                                {state.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={editingAddress.state_name || ""}
                            onChange={(e) =>
                              setEditingAddress({
                                ...editingAddress,
                                state_name: e.target.value,
                              })
                            }
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                          />
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          required
                          value={editingAddress.zipcode || ""}
                          onChange={(e) =>
                            setEditingAddress({
                              ...editingAddress,
                              zipcode: e.target.value,
                            })
                          }
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone (optional)
                      </label>
                      <input
                        type="tel"
                        value={editingAddress.phone || ""}
                        onChange={(e) =>
                          setEditingAddress({
                            ...editingAddress,
                            phone: e.target.value,
                          })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={editModalSaving}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {editModalSaving ? "Saving..." : "Save Address"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingAddress(null)}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

interface AddressFormProps {
  address: AddressFormData;
  countries: StoreCountry[];
  states: StoreState[];
  loadingStates: boolean;
  onChange: (field: keyof AddressFormData, value: string) => void;
  idPrefix: string;
}

function AddressForm({
  address,
  countries,
  states,
  loadingStates,
  onChange,
  idPrefix,
}: AddressFormProps) {
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
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}
