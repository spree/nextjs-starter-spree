"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import type { StoreOrder, StoreShipment, StoreCountry, StoreAddress, AddressParams } from "@spree/sdk"
import {
  getCheckoutOrder,
  updateOrderAddresses,
  advanceCheckout,
  getShipments,
  selectShippingRate,
  applyCouponCode,
  removeCouponCode,
  completeOrder,
} from "@/lib/data/checkout"
import { getCountries, getCountry } from "@/lib/data/countries"
import { getAddresses } from "@/lib/data/addresses"
import { isAuthenticated as checkAuth } from "@/lib/data/cookies"
import { AddressStep } from "@/components/checkout/AddressStep"
import { DeliveryStep } from "@/components/checkout/DeliveryStep"
import { PaymentStep } from "@/components/checkout/PaymentStep"
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
type CheckoutStep = "address" | "delivery" | "payment"

// Map Spree order state to checkout step
function getCheckoutStep(orderState: string): CheckoutStep {
  switch (orderState) {
    case "cart":
    case "address":
      return "address"
    case "delivery":
      return "delivery"
    case "payment":
    case "confirm":
      return "payment"
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
  const [savedAddresses, setSavedAddresses] = useState<StoreAddress[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
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
      const [orderData, countriesData, addressesData, authStatus] = await Promise.all([
        getCheckoutOrder(orderId),
        getCountries(),
        getAddresses(),
        checkAuth(),
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
      setSavedAddresses(addressesData.data)
      setIsAuthenticated(authStatus)
      setCurrentStep(getCheckoutStep(orderData.state))

      // Load shipments if in delivery or payment state
      if (orderData.state === "delivery" || orderData.state === "payment" || orderData.state === "confirm") {
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

  // Handle address submission (shipping address only)
  const handleAddressSubmit = async (addressData: {
    email: string
    ship_address: AddressParams
  }) => {
    if (!order) return

    setProcessing(true)
    setError(null)

    try {
      // Update order with shipping address and email
      const updateResult = await updateOrderAddresses(order.id, {
        email: addressData.email,
        ship_address_attributes: addressData.ship_address,
      })

      if (!updateResult.success) {
        setError(updateResult.error || "Failed to save address")
        setProcessing(false)
        return
      }

      // Advance to delivery step
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

  // Handle delivery confirmation (advance to payment step)
  const handleDeliveryConfirm = async () => {
    if (!order) return

    setProcessing(true)
    setError(null)

    try {
      // Advance to payment step
      const advanceResult = await advanceCheckout(order.id)
      if (!advanceResult.success) {
        setError(advanceResult.error || "Failed to proceed")
        setProcessing(false)
        return
      }

      // Reload order
      await loadOrder()
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  // Handle payment submission (billing address + complete order)
  const handlePaymentSubmit = async (paymentData: {
    bill_address: AddressParams
    use_shipping_for_billing: boolean
  }) => {
    if (!order) return

    setProcessing(true)
    setError(null)

    try {
      // Update billing address
      const updateResult = await updateOrderAddresses(order.id, {
        bill_address_attributes: paymentData.bill_address,
      })

      if (!updateResult.success) {
        setError(updateResult.error || "Failed to save billing address")
        setProcessing(false)
        return
      }

      // Complete the order (skip actual payment for now)
      const completeResult = await completeOrder(order.id)
      if (!completeResult.success) {
        setError(completeResult.error || "Failed to complete order")
        setProcessing(false)
        return
      }

      // Redirect to order confirmation
      if (completeResult.order) {
        router.push(`${basePath}/account/orders/${completeResult.order.id}`)
      }
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

  // Navigate back to a previous step
  const goToStep = (step: CheckoutStep) => {
    setCurrentStep(step)
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

  const steps = [
    { id: "address", label: "Shipping" },
    { id: "delivery", label: "Delivery" },
    { id: "payment", label: "Payment" },
  ]

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep)

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
            {steps.map((step, index) => (
              <li key={step.id} className={`relative ${index < steps.length - 1 ? "pr-8 sm:pr-20" : ""}`}>
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index < currentStepIndex
                        ? "bg-indigo-600 text-white"
                        : index === currentStepIndex
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {index < currentStepIndex ? "✓" : index + 1}
                  </div>
                  <span
                    className={`ml-4 text-sm font-medium ${
                      index === currentStepIndex
                        ? "text-indigo-600"
                        : index < currentStepIndex
                        ? "text-gray-900"
                        : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute top-4 left-8 w-full h-0.5 bg-gray-200">
                    <div
                      className={`h-full ${index < currentStepIndex ? "bg-indigo-600" : "bg-gray-200"}`}
                      style={{ width: index < currentStepIndex ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </li>
            ))}
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
              savedAddresses={savedAddresses}
              isAuthenticated={isAuthenticated}
              signInUrl={`${basePath}/account/login?redirect=${encodeURIComponent(pathname)}`}
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
              onBack={() => goToStep("address")}
              processing={processing}
            />
          )}

          {currentStep === "payment" && (
            <PaymentStep
              order={order}
              countries={countries}
              fetchStates={fetchStates}
              onSubmit={handlePaymentSubmit}
              onBack={() => goToStep("delivery")}
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
