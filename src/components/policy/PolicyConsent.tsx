"use client";

import type { Policy } from "@spree/sdk";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";

interface PolicyConsentProps {
  policies: Policy[];
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  basePath: string;
}

export function PolicyConsent({
  policies,
  checked,
  onCheckedChange,
  basePath,
}: PolicyConsentProps) {
  if (policies.length === 0) {
    return null;
  }

  return (
    <div className="flex items-start gap-2">
      <Checkbox
        id="policy-consent"
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="mt-0.5"
      />
      <label htmlFor="policy-consent" className="text-sm text-gray-600">
        I agree to the{" "}
        {policies.map((policy, index) => (
          <span key={policy.id}>
            {index > 0 && index < policies.length - 1 && ", "}
            {index > 0 && index === policies.length - 1 && " and "}
            <Link
              href={`${basePath}/policies/${policy.slug}`}
              target="_blank"
              className="text-primary hover:text-primary/70 underline"
            >
              {policy.name}
            </Link>
          </span>
        ))}
      </label>
    </div>
  );
}
