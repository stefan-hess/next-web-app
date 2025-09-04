"use client"
import React, { useEffect, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm() {
  const stripe = useStripe()
  const elements = useElements()
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPopover, setShowPopover] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setIsLoading(true)
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {},
      redirect: "if_required",
    })
    if (error) {
      setMessage(error.message || "An error occurred.")
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      setShowPopover(true)
      setTimeout(() => {
        window.location.replace("/premium-form")
      }, 2500)
      return
    } else {
      setMessage("Payment successful!")
    }
    setIsLoading(false)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto p-8 bg-base-100 rounded-xl shadow-lg space-y-6">
        <PaymentElement id="payment-element" />
        <button type="submit" className="btn btn-primary w-full" disabled={isLoading || !stripe || !elements}>
          {isLoading ? <span className="loading loading-spinner"></span> : "Pay"}
        </button>
        {message && <div className="alert alert-info mt-4">{message}</div>}
      </form>
      {showPopover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="rounded-2xl bg-white p-8 shadow-2xl max-w-sm w-full text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</div>
            <div className="mb-4 text-gray-700">You will be redirected to the premium form in a moment...</div>
            <div className="flex justify-center"><span className="loading loading-spinner loading-lg"></span></div>
          </div>
        </div>
      )}
    </>
  )
}

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [product, setProduct] = useState("monger")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    setClientSecret(null)
  }, [product, firstName, lastName, email])

  const handleStartCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!firstName || !lastName || !email) {
      setFormError("All fields are required.")
      return
    }
    const res = await fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: product === "monger" ? 1000 : 5000,
        plan: product,
        first_name: firstName,
        last_name: lastName,
        email,
      }),
    })
    const data = (await res.json()) as { clientSecret?: string; error?: string }
    if (data.clientSecret) {
      setClientSecret(data.clientSecret)
    } else {
      setFormError(data.error || "Failed to start checkout.")
    }
  }

  if (!clientSecret) {
    return (
      <form onSubmit={handleStartCheckout} className="max-w-md mx-auto p-8 bg-base-100 rounded-xl shadow-lg space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition"
            value={product}
            onChange={e => setProduct(e.target.value)}
          >
            <option value="monger">Monger 20 Stocks</option>
            <option value="buffett">Buffett 50 Stocks</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-blue-200 to-blue-400 px-6 py-3 font-semibold text-black shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95">
          Start Checkout
        </button>
        {formError && <div className="alert alert-error mt-4">{formError}</div>}
      </form>
    )
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm />
    </Elements>
  )
}
