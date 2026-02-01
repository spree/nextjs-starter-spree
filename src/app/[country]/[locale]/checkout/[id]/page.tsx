"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import type { StoreOrder, StoreShipment, StoreCountry } from "@spree/sdk"
import {
  getCheckoutOrder,
  updateOrderAddresses,
  advanceCheckout,
  getShipments,
  selectShippingRate,
  applyCouponCode,
  removeCouponCode,
} from "@/lib/data/checkout"
import { getCountries, getCountry } from "@/lib/data/countries"
import { AddressStep } from "@/components/checkout/AddressStep"
import { DeliveryStep } from "@/components/checkout/DeliveryStep"
import { CouponCode } from "@/components/checkout/CouponCode"
import { OrderSummary } from "@/components/checkout/OrderSummary"

// Extract base path from pathname (e.g., /us/en from /us/en/checkout/123)
function extractBasePath(pathname: string): string {
  const match = pathname.match(/^\/([a-z]{2})\/([a-z]{2})(\/|$)/i)
  if (match) {
    return `/${match[1]}/${match[2]}`
  }
  return ""
}

// Checkout steps
type CheckoutStep = "address" | "delivery" | "complete"

// Map Spree order state to checkout step
function getCheckoutStep(orderState: string): CheckoutStep {
  switch (orderState) {
    case "cart":
    case "address":
      return "address"
    case "delivery":
    case "payment":
    case "confirm":
      return "delivery"
    case "complete":
      return "complete"
    default:
      return "address"
  }
}

interface CheckoutPageProps {
  params: Promise<{
    id: string
    country: string
    locale: string
  }>
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const basePath = extractBasePath(pathname)

  const [order, setOrder] = useState<StoreOrder | null>(null)
  const [shipments, setShipments] = useState<StoreShipment[]>([])
  const [countries, setCountries] = useState<StoreCountry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("address")
  const [orderId, setOrderId] = useState<string | null>(null)

  // Load params
  useEffect(() => {
    params.then((p) => setOrderId(p.id))
  }, [params])

  // Load order and countries
  const loadOrder = useCallback(async () => {
    if (!orderId) return

    setLoading(true)
    setError(null)

    try {
      const [orderData, countriesData] = await Promise.all([
        getCheckoutOrder(orderId),
        getCountries(),
      ])

      if (!orderData) {
        setError("Order not found or you don't have access to it.")
        setLoading(false)
        return
      }

      // Check if order is already complete
      if (orderData.state === "complete") {
        router.push(`${basePath}/account/orders/${orderId}`)
        return
      }

      setOrder(orderData)
      setCountries(countriesData.data)
      setCurrentStep(getCheckoutStep(orderData.state))

      // Load shipments if in delivery state
      if (orderData.state === "delivery" || orderData.state === "payment") {
        const shipmentsData = await getShipments(orderId)
        setShipments(shipmentsData)
      }
    } catch {
      setError("Failed to load checkout. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [orderId, basePath, router])

  useEffect(() => {
    loadOrder()
  }, [loadOrder])

  // Handle address submission
  const handleAddressSubmit = async (addressData: {
    email: string
    ship_address: Parameters<typeof updateOrderAddresses>[1]["ship_address_attributes"]
    bill_address?: Parameters<typeof updateOrderAddresses>[1]["bill_address_attributes"]
    use_shipping_for_billing: boolean
  }) => {
    if (!order) return

    setProcessing(true)
    setError(null)

    try {
      // Update order with addresses
      const updateResult = await updateOrderAddresses(order.id, {
        email: addressData.email,
        ship_address_attributes: addressData.ship_address,
        bill_address_attributes: addressData.use_shipping_for_billing
          ? addressData.ship_address
          : addressData.bill_address,
      })

      if (!updateResult.success) {
        setError(updateResult.error || "Failed to save addresses")
        setProcessing(false)
        return
      }

      // Advance to next step
      const advanceResult = await advanceCheckout(order.id)
      if (!advanceResult.success) {
        setError(advanceResult.error || "Failed to proceed to next step")
        setProcessing(false)
        return
      }

      // Reload order to get updated state
      await loadOrder()
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  // Handle shipping rate selection
  const handleShippingRateSelect = async (shipmentId: string, rateId: string) => {
    if (!order) return

    setProcessing(true)
    setError(null)

    try {
      const result = await selectShippingRate(order.id, shipmentId, rateId)
      if (!result.success) {
        setError(result.error || "Failed to select shipping rate")
      }
      // Reload shipments
      const shipmentsData = await getShipments(order.id)
      setShipments(shipmentsData)
      // Reload order to get updated totals
      const orderData = await getCheckoutOrder(order.id)
      if (orderData) setOrder(orderData)
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  // Handle delivery confirmation (advance to payment/confirm)
  const handleDeliveryConfirm = async () => {
    if (!order) return

    setProcessing(true)
    setError(null)

    try {
      // Advance to next step
      const advanceResult = await advanceCheckout(order.id)
      if (!advanceResult.success) {
        setError(advanceResult.error || "Failed to proceed")
        setProcessing(false)
        return
      }

      // For now, we skip payment step - complete the order
      // In a real implementation, you would handle payment here
      // const completeResult = await completeOrder(order.id)
      // if (completeResult.success && completeResult.order) {
      //   router.push(`${basePath}/account/orders/${completeResult.order.id}`)
      // }

      // Reload order
      await loadOrder()
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  // Handle coupon code application
  const handleApplyCoupon = async (code: string) => {
    if (!order) return { success: false, error: "No order" }

    const result = await applyCouponCode(order.id, code)
    if (result.success && result.order) {
      setOrder(result.order)
    }
    return result
  }

  // Handle coupon code removal
  const handleRemoveCoupon = async (promotionId: string) => {
    if (!order) return { success: false, error: "No order" }

    const result = await removeCouponCode(order.id, promotionId)
    if (result.success && result.order) {
      setOrder(result.order)
    }
    return result
  }

  // Fetch states for a country
  const fetchStates = async (countryIso: string) => {
    try {
      const country = await getCountry(countryIso)
      return country.states || []
    } catch {
      return []
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-64 bg-gray-200 rounded" />
            </div>
            <div className="h-96 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !order) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Checkout Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href={`${basePath}/cart`}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Return to Cart
          </Link>
        </div>
      </div>
    )
  }

  if (!order) return null

  // Check if order has items
  if (!order.line_items || order.line_items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-6">Add some items to your cart before checking out.</p>
          <Link
            href={`${basePath}/products`}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        <p className="text-gray-500 mt-1">Order #{order.number}</p>
      </div>

      {/* Step indicator */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            <li className="relative pr-8 sm:pr-20">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === "address"
                      ? "bg-indigo-600 text-white"
                      : "bg-indigo-600 text-white"
                  }`}
                >
                  {currentStep === "address" ? "1" : "✓"}
                </div>
                <span
                  className={`ml-4 text-sm font-medium ${
                    currentStep === "address" ? "text-indigo-600" : "text-gray-900"
                  }`}
                >
                  Address
                </span>
              </div>
              <div className="absolute top-4 left-8 w-full h-0.5 bg-gray-200">
                <div
                  className={`h-full ${
                    currentStep !== "address" ? "bg-indigo-600" : "bg-gray-200"
                  }`}
                  style={{ width: currentStep !== "address" ? "100%" : "0%" }}
                />
              </div>
            </li>
            <li className="relative">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === "delivery"
                      ? "bg-indigo-600 text-white"
                      : currentStep === "complete"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {currentStep === "complete" ? "✓" : "2"}
                </div>
                <span
                  className={`ml-4 text-sm font-medium ${
                    currentStep === "delivery"
                      ? "text-indigo-600"
                      : currentStep === "complete"
                      ? "text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  Delivery
                </span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {currentStep === "address" && (
            <AddressStep
              order={order}
              countries={countries}
              fetchStates={fetchStates}
              onSubmit={handleAddressSubmit}
              processing={processing}
            />
          )}

          {currentStep === "delivery" && (
            <DeliveryStep
              order={order}
              shipments={shipments}
              onShippingRateSelect={handleShippingRateSelect}
              onConfirm={handleDeliveryConfirm}
              onBack={() => setCurrentStep("address")}
              processing={processing}
            />
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
            <OrderSummary order={order} />
            <div className="mt-6 pt-6 border-t border-gray-200">
              <CouponCode
                order={order}
                onApply={handleApplyCoupon}
                onRemove={handleRemoveCoupon}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
