"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { CONSENT_POLICIES } from "@/lib/constants/policies";
import { cn } from "@/lib/utils";
import { extractBasePath } from "@/lib/utils/path";

interface PolicyConsentProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: boolean;
}

export function PolicyConsent({
  checked,
  onCheckedChange,
  error,
}: PolicyConsentProps) {
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  const t = useTranslations("checkout");
  return (
    <div className="flex items-start gap-2.5">
      <Checkbox
        id="policy-consent"
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className={cn("mt-0.5", error && "border-red-500")}
      />
      <label
        htmlFor="policy-consent"
        className={cn("text-sm", error ? "text-red-500" : "text-gray-900")}
      >
        {t("iAgreeToThe")}{" "}
        {CONSENT_POLICIES.map((policy, index) => (
          <span key={policy.slug}>
            {index > 0 &&
              index < CONSENT_POLICIES.length - 1 &&
              t("policySeparatorComma")}
            {index > 0 &&
              index === CONSENT_POLICIES.length - 1 &&
              ` ${t("policySeparatorAnd")} `}
            <Link
              href={`${basePath}/policies/${policy.slug}`}
              target="_blank"
              className={cn(
                "underline",
                error
                  ? "text-red-500 hover:text-red-700"
                  : "text-primary hover:text-primary/70",
              )}
            >
              {policy.name}
            </Link>
          </span>
        ))}
      </label>
    </div>
  );
}
