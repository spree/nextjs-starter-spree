"use client";

import type { CreditCard as SpreeCreditCard } from "@spree/sdk";
import { useState } from "react";
import { PaymentIcon } from "react-svg-credit-card-payment-icons";
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
import { deleteCreditCard } from "@/lib/data/credit-cards";
import { getCardIconType, getCardLabel } from "@/lib/utils/credit-card";

function CreditCardItem({
  card,
  onDelete,
}: {
  card: SpreeCreditCard;
  onDelete: () => void;
}) {
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
        <div className="flex items-center gap-4">
          <PaymentIcon
            type={getCardIconType(card.brand)}
            format="flatRounded"
            width={48}
          />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {getCardLabel(card.brand)} ending in {card.last4}
            </p>
            <p className="text-xs text-gray-500">
              Exp {String(card.month).padStart(2, "0")}/{card.year}
            </p>
            {card.name && (
              <p className="text-sm text-gray-500 mt-1">{card.name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {card.default && (
            <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              Default
            </span>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleting}>
                {deleting ? "Removing..." : "Remove"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove payment method?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the {getCardLabel(card.brand)} ending in{" "}
                  {card.last4} from your account. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete}>
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

interface CreditCardListProps {
  initialCards: SpreeCreditCard[];
}

export function CreditCardList({ initialCards }: CreditCardListProps) {
  const [cards, setCards] = useState<SpreeCreditCard[]>(initialCards);

  const handleDelete = async (id: string) => {
    const result = await deleteCreditCard(id);
    if (result.success) {
      setCards((prev) => prev.filter((card) => card.id !== id));
    } else {
      alert(`Failed to remove card: ${result.error}`);
    }
  };

  return (
    <div className="space-y-4">
      {cards.map((card) => (
        <CreditCardItem
          key={card.id}
          card={card}
          onDelete={() => handleDelete(card.id)}
        />
      ))}
    </div>
  );
}
