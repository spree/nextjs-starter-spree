"use client";

import type { CreditCard as SpreeCreditCard } from "@spree/sdk";
import { CreditCard, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PaymentIcon } from "react-svg-credit-card-payment-icons";
import { getCreditCards } from "@/lib/data/credit-cards";
import { getCardIconType, getCardLabel } from "@/lib/utils/credit-card";

interface SavedCardsProps {
  /** Only load cards when the user is authenticated */
  isAuthenticated: boolean;
  /** Currently selected card's gateway_payment_profile_id, or null for new */
  selectedCardId: string | null;
  /** Called when the user picks a saved card or "add new" */
  onSelect: (cardId: string | null) => void;
}

/**
 * Shared saved cards selector for any payment gateway that supports
 * tokenized cards via the Spree CreditCards API.
 *
 * Import this in your gateway component (Stripe, Adyen, etc.) to let
 * users pick from saved payment methods or add a new one.
 */
export function SavedCards({
  isAuthenticated,
  selectedCardId,
  onSelect,
}: SavedCardsProps) {
  const [cards, setCards] = useState<SpreeCreditCard[]>([]);
  const [loading, setLoading] = useState(false);
  const initRef = useRef(false);

  const loadCards = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const result = await getCreditCards();
      const gatewayCards = result.data.filter(
        (card) => card.gateway_payment_profile_id,
      );
      setCards(gatewayCards);

      // Auto-select the default card on first load
      if (gatewayCards.length > 0) {
        const defaultCard =
          gatewayCards.find((c) => c.default) || gatewayCards[0];
        onSelect(defaultCard.gateway_payment_profile_id);
      }
    } catch {
      // Cards failed to load — proceed with new card flow
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, onSelect]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    loadCards();
  }, [loadCards]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">
          Loading saved cards...
        </span>
      </div>
    );
  }

  if (cards.length === 0) return null;

  const isAddingNew = selectedCardId === null;

  return (
    <div className="space-y-3">
      {cards.map((card) => (
        <label
          key={card.id}
          className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
            selectedCardId === card.gateway_payment_profile_id
              ? "border-gray-600 bg-gray-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <input
            type="radio"
            name="saved_card"
            checked={selectedCardId === card.gateway_payment_profile_id}
            onChange={() => onSelect(card.gateway_payment_profile_id)}
            className="w-4 h-4 text-primary border-gray-300"
          />
          <PaymentIcon
            type={getCardIconType(card.cc_type)}
            format="flatRounded"
            width={40}
          />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-900">
              {getCardLabel(card.cc_type)} ending in {card.last_digits}
            </span>
            <span className="text-sm text-gray-500 ml-2">
              Exp {String(card.month).padStart(2, "0")}/{card.year}
            </span>
          </div>
          {card.default && (
            <span className="text-xs font-medium text-primary bg-gray-100 px-2 py-0.5 rounded-lg">
              Default
            </span>
          )}
        </label>
      ))}

      {/* Add new payment method option */}
      <label
        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
          isAddingNew
            ? "border-gray-600 bg-gray-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <input
          type="radio"
          name="saved_card"
          checked={isAddingNew}
          onChange={() => onSelect(null)}
          className="w-4 h-4 text-primary border-gray-300"
        />
        <CreditCard className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
        <span className="text-sm font-medium text-gray-900">
          Add new payment method
        </span>
      </label>
    </div>
  );
}
