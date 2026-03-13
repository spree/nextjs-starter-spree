"use client";

import type { Cart, Order } from "@spree/sdk";
import { CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface CouponCodeProps {
  order: Cart | Order;
  onApply: (code: string) => Promise<{ success: boolean; error?: string }>;
  onRemove: (
    promotionId: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

export function CouponCode({ order, onApply, onRemove }: CouponCodeProps) {
  const t = useTranslations("coupon");
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const appliedPromotions = order.promotions || [];
  // Filter to only show promotions with codes (coupon codes)
  const couponPromotions = appliedPromotions.filter((p) => p.code);

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

  const handleRemove = async (promotionId: string) => {
    setRemoving(promotionId);
    setError(null);

    const result = await onRemove(promotionId);
    if (!result.success) {
      setError(result.error || t("failedToRemove"));
    }

    setRemoving(null);
  };

  // Check if there's already an applied code (only show one input at a time)
  const hasAppliedCode = couponPromotions.length > 0;

  return (
    <div>
      {/* Applied discount codes / gift cards */}
      {couponPromotions.length > 0 && (
        <div className="space-y-2 mb-4">
          {couponPromotions.map((promotion) => (
            <Alert key={promotion.id} role="status">
              <CheckCircle />
              <AlertDescription>
                <span className="font-medium">
                  {promotion.code || promotion.name}
                </span>
                <span className="text-muted-foreground ml-2">
                  {promotion.display_amount}
                </span>
              </AlertDescription>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                aria-label={t("removeCoupon", {
                  code: promotion.code || promotion.name,
                })}
                onClick={() => handleRemove(promotion.id)}
                disabled={removing === promotion.id}
              >
                {removing === promotion.id ? t("removing") : t("remove")}
              </Button>
            </Alert>
          ))}
        </div>
      )}

      {/* Apply new code - hidden when a code is already applied */}
      {!hasAppliedCode && (
        <form onSubmit={handleApply}>
          <Field data-invalid={!!error || undefined}>
            <div className="flex gap-2">
              <div className="flex-1">
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
                />
              </div>
              <Button type="submit" disabled={applying || !code.trim()}>
                {applying ? t("applying") : t("apply")}
              </Button>
            </div>
            {error && <FieldError>{error}</FieldError>}
          </Field>
        </form>
      )}
    </div>
  );
}
