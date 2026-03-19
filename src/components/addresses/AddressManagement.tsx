"use client";

import type { Address, AddressParams, Country } from "@spree/sdk";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
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
  updateAddress,
} from "@/lib/data/addresses";
import { getCountry } from "@/lib/data/countries";

interface AddressCardProps {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
}

function AddressCard({ address, onEdit, onDelete }: AddressCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
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
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete address?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this address. This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

interface AddressManagementProps {
  initialAddresses: Address[];
  countries: Country[];
  showAddButton: boolean;
  emptyState: boolean;
}

export function AddressManagement({
  initialAddresses,
  countries,
  showAddButton,
  emptyState,
}: AddressManagementProps) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
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
      setAddresses((prev) => prev.filter((addr) => addr.id !== id));
    } else {
      alert(`Failed to delete address: ${result.error}`);
    }
  };

  if (emptyState && addresses.length === 0) {
    return (
      <>
        <Button onClick={handleAdd}>Add Your First Address</Button>
        {modalOpen && (
          <AddressEditModal
            address={editingAddress}
            countries={countries}
            fetchStates={fetchStates}
            onSave={handleSave}
            onClose={() => setModalOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      {showAddButton && (
        <div className="mb-6">
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Address
          </Button>
        </div>
      )}

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

      {modalOpen && (
        <AddressEditModal
          address={editingAddress}
          countries={countries}
          fetchStates={fetchStates}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
