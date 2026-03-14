"use client";

import type { Shipment } from "@spree/sdk";

interface ShippingMethodSectionProps {
  shipments: Shipment[];
  onShippingRateSelect: (shipmentId: string, rateId: string) => Promise<void>;
  processing: boolean;
  errors?: string[];
}

export function ShippingMethodSection({
  shipments,
  onShippingRateSelect,
  processing,
  errors,
}: ShippingMethodSectionProps) {
  return (
    <div>
      <h2 className="text-[1.15rem] font-bold text-gray-900 mb-3">
        Shipping method
      </h2>

      {errors && errors.length > 0 && (
        <div className="rounded-[5px] border border-red-300 bg-red-50 px-4 py-3 mb-3">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-700">
              {error}
            </p>
          ))}
        </div>
      )}

      {shipments.length === 0 ? (
        <div className="rounded-[5px] bg-[#f0f0f0] px-4 py-3.5 text-sm text-gray-500">
          Enter your shipping address to view available shipping methods.
        </div>
      ) : (
        <div className="space-y-2">
          {shipments.map((shipment, index) => (
            <div key={shipment.id}>
              {shipments.length > 1 && (
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Shipment {index + 1} of {shipments.length}
                  {shipment.stock_location?.name && (
                    <span className="font-normal">
                      {" "}
                      &mdash; Ships from {shipment.stock_location.name}
                    </span>
                  )}
                </p>
              )}
              <div className="rounded-[5px] border border-[#d9d9d9] overflow-hidden">
                {shipment.shipping_rates.map((rate, rateIndex) => (
                  <label
                    key={rate.id}
                    className={`flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors ${
                      rate.selected
                        ? "bg-[#f0f5ff]"
                        : "bg-white hover:bg-gray-50"
                    } ${rateIndex > 0 ? "border-t border-[#d9d9d9]" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`shipping-rate-${shipment.id}`}
                        checked={rate.selected}
                        onChange={() =>
                          onShippingRateSelect(shipment.id, rate.id)
                        }
                        disabled={processing}
                        className="h-[18px] w-[18px] accent-black"
                      />
                      <span className="text-sm text-gray-900">{rate.name}</span>
                    </div>
                    <span className="text-sm text-gray-900">
                      {rate.display_cost}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
