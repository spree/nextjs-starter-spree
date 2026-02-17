"use client";

import type { StoreCreditCard } from "@spree/sdk";
import { useCallback, useEffect, useState } from "react";
import { PaymentIcon } from "react-svg-credit-card-payment-icons";
import { CreditCardIcon, LockIcon } from "@/components/icons";
import { deleteCreditCard, getCreditCards } from "@/lib/data/credit-cards";
import { getCardIconType, getCardLabel } from "@/lib/utils/credit-card";

function CreditCardItem({
  card,
  onDelete,
}: {
  card: StoreCreditCard;
  onDelete: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove this card?")) return;
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
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Default
            </span>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
          >
            {deleting ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreditCardsPage() {
  const [cards, setCards] = useState<StoreCreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCards = useCallback(async () => {
    const response = await getCreditCards();
    setCards(response.data);
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
          <CreditCardIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
          <LockIcon className="w-4 h-4 inline mr-1" />
          Your payment information is securely stored and encrypted. We never
          store your full card number.
        </p>
      </div>
    </div>
  );
}
