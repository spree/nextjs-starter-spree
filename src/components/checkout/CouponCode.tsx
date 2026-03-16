"use client";

import type { Cart } from "@spree/sdk";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CouponCodeProps {
  cart: Cart;
  onApply: (code: string) => Promise<{ success: boolean; error?: string }>;
  onRemove: (code: string) => Promise<{ success: boolean; error?: string }>;
}

export function CouponCode({ cart, onApply, onRemove }: CouponCodeProps) {
  const t = useTranslations("coupon");
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const appliedPromotions = cart.promotions || [];
  const couponPromotions = appliedPromotions.filter(
    (p): p is typeof p & { code: string } => !!p.code,
  );

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setApplying(true);
    setError(null);

    const result = await onApply(code.trim());
    if (result.success) {
      setCode("");
    } else {
      setError(result.error || t("invalidCode"));
    }

    setApplying(false);
  };

  const handleRemove = async (code: string) => {
    setRemoving(code);
    setError(null);

    const result = await onRemove(code);
    if (!result.success) {
      setError(result.error || t("failedToRemove"));
    }

    setRemoving(null);
  };

  const hasAppliedCode = couponPromotions.length > 0;

  return (
    <div>
      {/* Applied codes */}
      {couponPromotions.length > 0 && (
        <div className="space-y-2 mb-3">
          {couponPromotions.map((promotion) => (
            <div
              key={promotion.id}
              className="flex items-center justify-between rounded-sm border border-gray-200 bg-gray-50 px-3 py-2"
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-900">
                  {promotion.code || promotion.name}
                </span>
                <span className="text-gray-500">
                  {promotion.display_amount}
                </span>
              </div>
              {promotion.code && (
                <button
                  onClick={() => handleRemove(promotion.code)}
                  disabled={removing === promotion.code}
                  aria-label={t("removeCoupon", {
                    code: promotion.code || promotion.name,
                  })}
                  className="text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Apply new code — Shopify style: input + Apply button in a row */}
      {!hasAppliedCode && (
        <form onSubmit={handleApply} className="flex gap-2">
          <Input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            aria-invalid={!!error}
            className="flex-1"
          />
          <Button type="submit" disabled={applying || !code.trim()}>
            {applying ? t("applying") : t("apply")}
          </Button>
        </form>
      )}

      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}
