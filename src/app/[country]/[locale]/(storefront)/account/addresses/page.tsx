"use client";

import type {
  AddressParams,
  StoreAddress,
  StoreCountry,
  StoreState,
} from "@spree/sdk";
import { useEffect, useState } from "react";
import {
  createAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
} from "@/lib/data/addresses";
import { getCountries, getCountry } from "@/lib/data/countries";
import {
  type AddressFormData,
  addressToFormData,
  emptyAddress,
  formDataToAddress,
} from "@/lib/utils/address";

function AddressCard({
  address,
  onEdit,
  onDelete,
}: {
  address: StoreAddress;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-gray-900">{address.full_name}</p>
          {address.company && (
            <p className="text-sm text-gray-500">{address.company}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">{address.address1}</p>
          {address.address2 && (
            <p className="text-sm text-gray-500">{address.address2}</p>
          )}
          <p className="text-sm text-gray-500">
            {address.city}, {address.state_text} {address.zipcode}
          </p>
          <p className="text-sm text-gray-500">{address.country_name}</p>
          {address.phone && (
            <p className="text-sm text-gray-500 mt-2">{address.phone}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddressModal({
  isOpen,
  onClose,
  address,
  countries,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  address: StoreAddress | null;
  countries: StoreCountry[];
  onSave: (data: AddressParams, id?: string) => Promise<void>;
}) {
  const [formData, setFormData] = useState<AddressFormData>(emptyAddress);
  const [states, setStates] = useState<StoreState[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Initialize form data when address changes
  useEffect(() => {
    setFormData(address ? addressToFormData(address) : emptyAddress);
    setError("");
  }, [address, isOpen]);

  // Load states when country changes
  useEffect(() => {
    async function loadStates() {
      if (!formData.country_iso) {
        setStates([]);
        return;
      }
      const country = await getCountry(formData.country_iso);
      if (country?.states) {
        setStates(country.states);
      } else {
        setStates([]);
      }
    }
    loadStates();
  }, [formData.country_iso]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      await onSave(formDataToAddress(formData), address?.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 opacity-50 transition-opacity"
          onClick={onClose}
        />

        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {address ? "Edit Address" : "Add New Address"}
              </h3>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
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
                      value={formData.firstname}
                      onChange={(e) =>
                        setFormData({ ...formData, firstname: e.target.value })
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
                      value={formData.lastname}
                      onChange={(e) =>
                        setFormData({ ...formData, lastname: e.target.value })
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
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
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
                    value={formData.address1}
                    onChange={(e) =>
                      setFormData({ ...formData, address1: e.target.value })
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
                    value={formData.address2}
                    onChange={(e) =>
                      setFormData({ ...formData, address2: e.target.value })
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
                    value={formData.country_iso}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        country_iso: e.target.value,
                        state_abbr: "",
                        state_name: "",
                      })
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
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {states.length > 0 ? "State" : "State/Region"}
                    </label>
                    {states.length > 0 ? (
                      <select
                        value={formData.state_abbr}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            state_abbr: e.target.value,
                          })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      >
                        <option value="">Select state</option>
                        {states.map((state) => (
                          <option key={state.abbr} value={state.abbr}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData.state_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
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
                      value={formData.zipcode}
                      onChange={(e) =>
                        setFormData({ ...formData, zipcode: e.target.value })
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
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={saving}
                className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Address"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<StoreAddress[]>([]);
  const [countries, setCountries] = useState<StoreCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<StoreAddress | null>(
    null,
  );

  useEffect(() => {
    async function loadData() {
      const [addressResponse, countriesResponse] = await Promise.all([
        getAddresses(),
        getCountries(),
      ]);
      setAddresses(addressResponse.data);
      setCountries(countriesResponse.data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleEdit = (address: StoreAddress) => {
    setEditingAddress(address);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingAddress(null);
    setModalOpen(true);
  };

  const handleSave = async (data: AddressParams, id?: string) => {
    if (id) {
      const result = await updateAddress(id, data);
      if (!result.success) {
        throw new Error(result.error);
      }
      // Update just the one address in state
      if (result.address) {
        setAddresses((prev) =>
          prev.map((addr) => (addr.id === id ? result.address! : addr)),
        );
      }
    } else {
      const result = await createAddress(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      // Append the new address
      if (result.address) {
        setAddresses((prev) => [...prev, result.address!]);
      }
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteAddress(id);
    if (result.success) {
      // Remove the address from state
      setAddresses((prev) => prev.filter((addr) => addr.id !== id));
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Addresses</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Addresses</h1>
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No addresses saved
          </h3>
          <p className="text-gray-500 mb-6">
            Add an address for faster checkout.
          </p>
          <button
            onClick={handleAdd}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Add Your First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => handleEdit(address)}
              onDelete={() => handleDelete(address.id)}
            />
          ))}
        </div>
      )}

      <AddressModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        address={editingAddress}
        countries={countries}
        onSave={handleSave}
      />
    </div>
  );
}
