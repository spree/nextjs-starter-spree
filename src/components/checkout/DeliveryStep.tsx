"use client";

import type { StoreOrder, StoreShipment } from "@spree/sdk";

interface DeliveryStepProps {
  order: StoreOrder;
  shipments: StoreShipment[];
  onShippingRateSelect: (shipmentId: string, rateId: string) => Promise<void>;
  onConfirm: () => Promise<void>;
  onBack: () => void;
  processing: boolean;
}

export function DeliveryStep({
  order,
  shipments,
  onShippingRateSelect,
  onConfirm,
  onBack,
  processing,
}: DeliveryStepProps) {
  // Check if all shipments have a selected rate
  const allRatesSelected = shipments.every((shipment) =>
    shipment.shipping_rates.some((rate) => rate.selected),
  );

  const handleRateChange = async (shipmentId: string, rateId: string) => {
    await onShippingRateSelect(shipmentId, rateId);
  };

  return (
    <div className="space-y-8">
      {/* Shipping Address Summary */}
      {order.ship_address && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Shipping Address
            </h2>
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Edit
            </button>
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-900">
              {order.ship_address.full_name}
            </p>
            {order.ship_address.company && <p>{order.ship_address.company}</p>}
            <p>{order.ship_address.address1}</p>
            {order.ship_address.address2 && (
              <p>{order.ship_address.address2}</p>
            )}
            <p>
              {order.ship_address.city},{" "}
              {order.ship_address.state_text || order.ship_address.state_name}{" "}
              {order.ship_address.zipcode}
            </p>
            <p>{order.ship_address.country_name}</p>
            {order.ship_address.phone && (
              <p className="mt-2">Phone: {order.ship_address.phone}</p>
            )}
          </div>
        </div>
      )}

      {/* Shipping Methods */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Shipping Method
        </h2>

        {shipments.length === 0 ? (
          <p className="text-gray-500">Loading shipping options...</p>
        ) : (
          <div className="space-y-6">
            {shipments.map((shipment, index) => (
              <div key={shipment.id}>
                {shipments.length > 1 && (
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Shipment {index + 1} of {shipments.length}
                    {shipment.stock_location?.name && (
                      <span className="font-normal text-gray-500">
                        {" "}
                        &mdash; Ships from {shipment.stock_location.name}
                      </span>
                    )}
                  </h3>
                )}
                <div className="space-y-3">
                  {shipment.shipping_rates.map((rate) => (
                    <label
                      key={rate.id}
                      className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-colors ${
                        rate.selected
                          ? "border-primary-600 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name={`shipping-rate-${shipment.id}`}
                          checked={rate.selected}
                          onChange={() =>
                            handleRateChange(shipment.id, rate.id)
                          }
                          disabled={processing}
                          className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                        />
                        <div className="ml-3">
                          <span className="block text-sm font-medium text-gray-900">
                            {rate.name}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
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

      {/* Actions */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={processing}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={processing || !allRatesSelected}
          className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? "Processing..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
