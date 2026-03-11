"use client";

import type { CreditCard as SpreeCreditCard } from "@spree/sdk";
import { CreditCard, Lock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
import { deleteCreditCard, getCreditCards } from "@/lib/data/credit-cards";
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
            type={getCardIconType(card.cc_type)}
            format="flatRounded"
            width={48}
          />
          <div>
            <p className="font-medium text-gray-900">
              {getCardLabel(card.cc_type)} ending in {card.last_digits}
            </p>
            <p className="text-sm text-gray-500">
              Expires {String(card.month).padStart(2, "0")}/{card.year}
            </p>
            {card.name && (
              <p className="text-sm text-gray-500 mt-1">{card.name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {card.default && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-green-100 text-green-800">
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
                  This will remove the {getCardLabel(card.cc_type)} ending in{" "}
                  {card.last_digits} from your account. This action cannot be
                  undone.
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

export default function CreditCardsPage() {
  const [cards, setCards] = useState<SpreeCreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCards = useCallback(async () => {
    try {
      const response = await getCreditCards();
      setCards(response.data);
    } catch {
      setCards([]);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      await loadCards();
      setLoading(false);
    }
    loadData();
  }, [loadCards]);

  const handleDelete = async (id: string) => {
    const result = await deleteCreditCard(id);
    if (result.success) {
      await loadCards();
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Payment Methods
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Payment Methods</h1>

      {cards.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No payment methods saved
          </h3>
          <p className="text-gray-500">
            Payment methods are saved automatically when you make a purchase.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {cards.map((card) => (
            <CreditCardItem
              key={card.id}
              card={card}
              onDelete={() => handleDelete(card.id)}
            />
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <p className="text-sm text-gray-600">
          <Lock className="w-4 h-4 inline mr-1" />
          Your payment information is securely stored and encrypted. We never
          store your full card number.
        </p>
      </div>
    </div>
  );
}
