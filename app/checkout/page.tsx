"use client"
import React, { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"


const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const PRICES = [
  { id: "price_1S58CGI8pTUJRz6FyikGu4R7", name: "Munger", amount: 4.99, description: "Follow 10 Stocks" },
  { id: "price_1S58CtI8pTUJRz6FSh35gDnU", name: "Buffett", amount: 8.99, description: "Follow 20 Stocks" },
  { id: "price_enterprise", name: "Enterprise", amount: "Contact for quote", description: "For funds, small research shops, teams" },
];

export default function CheckoutPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showEnterprisePopover, setShowEnterprisePopover] = useState(false);

  const handleSubscribeClick = (planId: string) => {
    if (planId === "price_enterprise") {
      setShowEnterprisePopover(true);
      return;
    }
    setSelectedPlan(planId);
    setFormError(null);
  };

  const handleStartCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!firstName || !lastName || !email) {
      setFormError("All fields are required.");
      return;
    }
    setIsLoading(true);
    try {
      const stripe = await stripePromise;
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: selectedPlan,
          email,
          firstName,
          lastName,
        }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (data.id) {
        await stripe!.redirectToCheckout({ sessionId: data.id });
      } else {
        setFormError(data.error || "Failed to start checkout.");
      }
    } catch (err) {
      setFormError("Failed to start checkout.");
    }
    setIsLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="mt-16 w-full max-w-2xl rounded-xl bg-white p-8 shadow-xl">
        <div className="flex justify-end mb-2">
          <a
            href="/premium-form"
            className="text-xs px-3 py-1 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition font-medium shadow-sm border border-indigo-200"
          >
            Already have premium?
          </a>
        </div>
        <h1 className="mb-4 text-center text-4xl font-bold text-indigo-800">Premium Plans</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {PRICES.map((plan) => (
            <div key={plan.id} className={`border rounded-lg shadow p-6 flex flex-col justify-between ${selectedPlan === plan.id ? 'ring-2 ring-blue-500' : ''}`}>
              <div>
                <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
                <p className={plan.id === "price_enterprise" ? "text-gray-600 mb-4 text-xs" : "text-gray-600 mb-4"}>{plan.description}</p>
                <p className="text-3xl font-bold mb-2">{plan.id === "price_enterprise" ? "Individual" : `$${plan.amount}/mo`}</p>
                {plan.id !== "price_enterprise" && (
                  <p className="mb-6 text-xs text-gray-500">You will be charged for the first time the following month.</p>
                )}
              </div>
              {plan.id === "price_enterprise" ? (
                <button
                  onClick={() => handleSubscribeClick(plan.id)}
                  disabled={isLoading}
                  className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Contact Us
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribeClick(plan.id)}
                  disabled={isLoading}
                  className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {selectedPlan === plan.id ? "Selected" : "Subscribe"}
                </button>
              )}
            </div>
          ))}
        </div>
        {showEnterprisePopover && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative rounded-2xl bg-white/90 p-8 shadow-2xl max-w-sm w-full transform transition-all">
              <button
                onClick={() => setShowEnterprisePopover(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none"
                aria-label="Close"
              >
                &times;
              </button>
              <p className="mb-6 text-center text-xl font-semibold text-black">
                Please contact us at <a href="mailto:info@stock-ticker-news.com" className="text-blue-600 underline">info@stock-ticker-news.com</a>
              </p>
            </div>
          </div>
        )}
        {selectedPlan && selectedPlan !== "price_enterprise" && (
          <form onSubmit={handleStartCheckout} className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg space-y-6 border">
            <h2 className="text-2xl font-semibold text-center mb-4">Enter your details</h2>
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
              {isLoading ? <span className="loading loading-spinner"></span> : "Go to payment"}
            </button>
            {formError && <div className="alert alert-error mt-4">{formError}</div>}
          </form>
        )}
      </div>
    </main>
  );
}
