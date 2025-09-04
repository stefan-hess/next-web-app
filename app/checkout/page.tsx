"use client"
import React, { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const PRICE_IDS: Record<string, string> = {
  munger: "price_1S2aWbREANM77N65G8nyK5ld",
  buffett: "price_1S2ae1REANM77N650wVydHZG",
}

export default function CheckoutPage() {
  const [product, setProduct] = useState("munger")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleStartCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!firstName || !lastName || !email) {
      setFormError("All fields are required.")
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: PRICE_IDS[product],
          email,
          firstName,
          lastName,
          plan: product,
        }),
      })
  const data = (await res.json()) as { id?: string; error?: string }
      if (data.id) {
        const stripe = await stripePromise
        await stripe?.redirectToCheckout({ sessionId: data.id })
      } else {
        setFormError(data.error || "Failed to start checkout.")
      }
    } catch (err) {
      setFormError("Failed to start checkout.")
    }
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleStartCheckout} className="max-w-md mx-auto p-8 bg-base-100 rounded-xl shadow-lg space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
        <select
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition"
          value={product}
          onChange={e => setProduct(e.target.value)}
        >
          <option value="munger">Munger 20 Stocks</option>
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
      <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-blue-200 to-blue-400 px-6 py-3 font-semibold text-black shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95" disabled={isLoading}>
        {isLoading ? <span className="loading loading-spinner"></span> : "Start Checkout"}
      </button>
      {formError && <div className="alert alert-error mt-4">{formError}</div>}
    </form>
  )
}
