"use client";

import type { Address, AddressParams, Country } from "@spree/sdk";
import { MapPin, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { AddressEditModal } from "@/components/checkout/AddressEditModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  createAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
} from "@/lib/data/addresses";
import { getCountries, getCountry } from "@/lib/data/countries";

function AddressCard({
  address,
  onEdit,
  onDelete,
}: {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("account");
  const tc = useTranslations("common");
  const ta = useTranslations("address");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-start">
        <div className="text-sm text-gray-600 space-y-0.5">
          <p className="font-medium text-gray-800">{address.full_name}</p>
          {address.company && <p>{address.company}</p>}
          <p>{address.address1}</p>
          {address.address2 && <p>{address.address2}</p>}
          <p>
            {address.city}, {address.state_text} {address.zipcode}
          </p>
          <p>{address.country_name}</p>
          {address.phone && <p className="mt-1">{address.phone}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="link" size="sm" onClick={onEdit}>
            {tc("edit")}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleting}>
                {deleting ? ta("deleting") : tc("remove")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{ta("deleteAddressTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("deleteConfirm")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete}>
                  {ta("delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

export default function AddressesPage() {
  const t = useTranslations("account");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const fetchStates = useCallback(async (countryIso: string) => {
    try {
      const country = await getCountry(countryIso);
      return country?.states ?? [];
    } catch {
      return [];
    }
  }, []);

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

  const handleEdit = (address: Address) => {
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {t("addresses")}
        </h1>
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-6"
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
        <h1 className="text-2xl font-bold text-gray-900">{t("addresses")}</h1>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          {t("addNewAddress")}
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("noAddresses")}
          </h3>
          <p className="text-gray-500 mb-6">{t("noAddressesDescription")}</p>
          <Button onClick={handleAdd}>{t("addNewAddress")}</Button>
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

      {modalOpen && (
        <AddressEditModal
          address={editingAddress}
          countries={countries}
          fetchStates={fetchStates}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
