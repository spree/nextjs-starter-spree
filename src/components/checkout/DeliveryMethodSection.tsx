"use client";

import type { Fulfillment } from "@spree/sdk";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface DeliveryMethodSectionProps {
  fulfillments: Fulfillment[];
  onDeliveryRateSelect: (
    fulfillmentId: string,
    rateId: string,
  ) => Promise<void>;
  processing: boolean;
  errors?: string[];
}

export function DeliveryMethodSection({
  fulfillments,
  onDeliveryRateSelect,
  processing,
  errors,
}: DeliveryMethodSectionProps) {
  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-3">Shipping method</h2>

      {errors && errors.length > 0 && (
        <div className="rounded-sm border border-red-300 bg-red-50 px-4 py-3 mb-3">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-700">
              {error}
            </p>
          ))}
        </div>
      )}

      {fulfillments.length === 0 ? (
        <div className="rounded-sm bg-gray-100 px-4 py-3.5 text-sm text-gray-500">
          Enter your shipping address to view available shipping methods.
        </div>
      ) : (
        <div className="space-y-2">
          {fulfillments.map((fulfillment, index) => {
            const selectedRate = fulfillment.delivery_rates.find(
              (r) => r.selected,
            );
            return (
              <div key={fulfillment.id}>
                {fulfillments.length > 1 && (
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Package {index + 1} of {fulfillments.length}
                    {fulfillment.stock_location?.name && (
                      <span className="font-normal">
                        {" "}
                        &mdash; Fulfilled from {fulfillment.stock_location.name}
                      </span>
                    )}
                  </p>
                )}
                <RadioGroup
                  value={selectedRate?.id ?? ""}
                  onValueChange={(rateId) =>
                    onDeliveryRateSelect(fulfillment.id, rateId)
                  }
                  disabled={processing}
                  className="rounded-sm border overflow-hidden gap-0"
                >
                  {fulfillment.delivery_rates.map((rate, rateIndex) => (
                    <label
                      key={rate.id}
                      className={`flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors ${
                        rate.selected
                          ? "bg-blue-50"
                          : "bg-white hover:bg-gray-50"
                      } ${rateIndex > 0 ? "border-t" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={rate.id} />
                        <span className="text-sm text-gray-900">
                          {rate.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-900">
                        {rate.display_cost}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
