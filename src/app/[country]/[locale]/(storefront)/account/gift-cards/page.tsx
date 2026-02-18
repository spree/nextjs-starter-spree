"use client";

import { useEffect, useState } from "react";
import {
  CheckIcon,
  ClipboardCopyIcon,
  GiftIcon,
  InfoCircleIcon,
} from "@/components/icons";
import { getGiftCards } from "@/lib/data/gift-cards";

// Gift card type (matches SDK StoreGiftCard)
interface GiftCard {
  id: string;
  code: string;
  state: string;
  currency: string;
  amount: number;
  amount_used: number;
  amount_authorized: number;
  amount_remaining: number;
  display_amount: string;
  display_amount_used: string;
  display_amount_remaining: string;
  expires_at: string | null;
  redeemed_at: string | null;
  expired: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

function getStateColor(state: string, expired: boolean): string {
  if (expired) return "bg-gray-100 text-gray-800";
  switch (state) {
    case "active":
      return "bg-green-100 text-green-800";
    case "partially_redeemed":
      return "bg-yellow-100 text-yellow-800";
    case "redeemed":
      return "bg-gray-100 text-gray-800";
    case "canceled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStateLabel(state: string): string {
  switch (state) {
    case "active":
      return "Active";
    case "partially_redeemed":
      return "Partially Used";
    case "redeemed":
      return "Fully Redeemed";
    case "canceled":
      return "Canceled";
    case "expired":
      return "Expired";
    default:
      return state;
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "No expiration";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-2 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
      title="Copy code to clipboard"
    >
      {copied ? (
        <>
          <CheckIcon className="w-4 h-4 text-green-600" />
          <span className="text-green-600">Copied!</span>
        </>
      ) : (
        <>
          <ClipboardCopyIcon className="w-4 h-4" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

function GiftCardItem({ card }: { card: GiftCard }) {
  const usagePercentage =
    card.amount > 0 ? Math.round((card.amount_used / card.amount) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-semibold text-gray-900">
              {card.code}
            </span>
            <CopyButton code={card.code} />
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStateColor(card.state, card.expired)}`}
            >
              {getStateLabel(card.state)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {card.expires_at
              ? `Expires ${formatDate(card.expires_at)}`
              : "No expiration date"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">
            {card.display_amount_remaining}
          </p>
          <p className="text-sm text-gray-500">remaining</p>
        </div>
      </div>

      {/* Progress bar showing usage */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">
            Used: {card.display_amount_used}
          </span>
          <span className="text-gray-600">Total: {card.display_amount}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              usagePercentage >= 100 ? "bg-gray-400" : "bg-primary-500"
            }`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">{usagePercentage}% used</p>
      </div>

      {/* Additional info */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Added on {formatDate(card.created_at)}</span>
          {card.redeemed_at && (
            <span>Fully redeemed on {formatDate(card.redeemed_at)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GiftCardsPage() {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const response = await getGiftCards();
      setCards(response.data);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Gift Cards</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-2 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Separate active and inactive cards
  const activeCards = cards.filter((c) => c.active && !c.expired);
  const inactiveCards = cards.filter((c) => !c.active || c.expired);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gift Cards</h1>

      {cards.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <GiftIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No gift cards
          </h3>
          <p className="text-gray-500">
            You don&apos;t have any gift cards associated with your account yet.
          </p>
        </div>
      ) : (
        <>
          {/* Active Cards */}
          {activeCards.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Active Gift Cards ({activeCards.length})
              </h2>
              <div className="space-y-4">
                {activeCards.map((card) => (
                  <GiftCardItem key={card.id} card={card} />
                ))}
              </div>
            </div>
          )}

          {/* Inactive Cards */}
          {inactiveCards.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-500 mb-4">
                Expired / Redeemed ({inactiveCards.length})
              </h2>
              <div className="space-y-4 opacity-75">
                {inactiveCards.map((card) => (
                  <GiftCardItem key={card.id} card={card} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <p className="text-sm text-gray-600">
          <InfoCircleIcon className="w-4 h-4 inline mr-1" />
          Gift cards can be used during checkout to pay for your orders. The
          remaining balance will be saved for future purchases.
        </p>
      </div>
    </div>
  );
}
