"use client";

import type { Country, State } from "@spree/sdk";
import { CircleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
  countries: Country[];
  fetchStates: (countryIso: string) => Promise<State[]>;
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
    address ? addressToFormData(address) : { ...emptyAddress },
  );
  const [states, setStates] = useState<State[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      .catch(() => {
        if (!cancelled) setStates([]);
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
    setError(null);
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
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg p-0 gap-0" showCloseButton={false}>
        <form onSubmit={handleSubmit}>
          <div className="px-4 pt-5 pb-4 sm:p-6">
            <DialogTitle className="text-lg font-medium text-gray-900 mb-4">
              {modalTitle}
            </DialogTitle>

            {error && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
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

          <div className="border-t border-gray-200 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Address"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
