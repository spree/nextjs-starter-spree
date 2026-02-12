"use client";

import type { StoreCountry, StoreState } from "@spree/sdk";
import { useCallback, useEffect, useState } from "react";
import {
  type AddressFormData,
  addressToFormData,
  emptyAddress,
  formDataToAddress,
} from "@/lib/utils/address";
import { AddressFormFields } from "./AddressFormFields";

interface AddressEditModalProps {
  address: {
    id?: string;
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
  } | null;
  countries: StoreCountry[];
  fetchStates: (countryIso: string) => Promise<StoreState[]>;
  onSave: (
    data: ReturnType<typeof formDataToAddress>,
    id?: string,
  ) => Promise<void>;
  onClose: () => void;
  title?: string;
}

export function AddressEditModal({
  address,
  countries,
  fetchStates,
  onSave,
  onClose,
  title,
}: AddressEditModalProps) {
  const [formData, setFormData] = useState<AddressFormData>(
    address ? addressToFormData(address) : emptyAddress,
  );
  const [states, setStates] = useState<StoreState[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Load states when country changes
  useEffect(() => {
    if (!formData.country_iso) {
      setStates([]);
      return;
    }

    let cancelled = false;
    setLoadingStates(true);

    fetchStates(formData.country_iso)
      .then((result) => {
        if (!cancelled) setStates(result);
      })
      .finally(() => {
        if (!cancelled) setLoadingStates(false);
      });

    return () => {
      cancelled = true;
    };
  }, [formData.country_iso, fetchStates]);

  const handleChange = (field: keyof AddressFormData, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "country_iso") {
        updated.state_abbr = "";
        updated.state_name = "";
      }
      return updated;
    });
  };

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

  const modalTitle =
    title ?? (address?.id ? "Edit Address" : "Add New Address");

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="address-modal-title"
    >
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 opacity-50 transition-opacity"
          onClick={onClose}
        />

        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
              <h3
                id="address-modal-title"
                className="text-lg font-medium text-gray-900 mb-4"
              >
                {modalTitle}
              </h3>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <AddressFormFields
                address={formData}
                countries={countries}
                states={states}
                loadingStates={loadingStates}
                onChange={handleChange}
                idPrefix="modal"
              />
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
