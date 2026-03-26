"use client";

import type { Policy } from "@spree/sdk";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface PolicyConsentProps {
  policies: Policy[];
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  basePath: string;
  error?: boolean;
}

export function PolicyConsent({
  policies,
  checked,
  onCheckedChange,
  basePath,
  error,
}: PolicyConsentProps) {
  if (policies.length === 0) {
    return null;
  }

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
        I agree to the{" "}
        {policies.map((policy, index) => (
          <span key={policy.id}>
            {index > 0 && index < policies.length - 1 && ", "}
            {index > 0 && index === policies.length - 1 && " and "}
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
