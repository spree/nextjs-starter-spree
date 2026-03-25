import type { Address } from "@spree/sdk";

interface AddressBlockProps {
  address: Address;
}

export function AddressBlock({ address }: AddressBlockProps) {
  return (
    <div className="text-sm text-gray-600 space-y-0.5">
      <p className="font-medium text-gray-800">{address.full_name}</p>
      {address.company && <p>{address.company}</p>}
      <p>{address.address1}</p>
      {address.address2 && <p>{address.address2}</p>}
      <p>
        {[
          address.city,
          [address.state_text, address.postal_code].filter(Boolean).join(" "),
        ]
          .filter(Boolean)
          .join(", ")}
      </p>
      <p>{address.country_name}</p>
      {address.phone && <p className="mt-1">{address.phone}</p>}
    </div>
  );
}
