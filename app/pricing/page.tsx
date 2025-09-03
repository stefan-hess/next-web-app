"use client";

import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const PRICES = [
    { id: "price_basic", name: "Basic", amount: 10, description: "For individuals" },
    { id: "price_pro", name: "Pro", amount: 25, description: "For small teams" },
    { id: "price_enterprise", name: "Enterprise", amount: 50, description: "For large organizations" },
];

export default function PricingPage() {
    const [loading, setLoading] = useState(false);

    const handleCheckout = async (priceId: string) => {
    setLoading(true);
    try {
        const stripe = await stripePromise;

        const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
        });

        // Tell TypeScript what shape we expect using 'as'
        const data = (await res.json()) as { id: string };

        await stripe!.redirectToCheckout({ sessionId: data.id });
    } catch (err) {
        console.error("Error creating checkout session:", err);
    } finally {
        setLoading(false);
    }
    };

    return (
    <div className="max-w-6xl mx-auto py-16 px-4">
        <h1 className="text-4xl font-bold text-center mb-12">Pricing Plans</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PRICES.map((plan) => (
            <div key={plan.id} className="border rounded-lg shadow p-6 flex flex-col justify-between">
            <div>
                <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <p className="text-3xl font-bold mb-6">${plan.amount}/mo</p>
            </div>
            <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
                {loading ? "Redirecting..." : "Subscribe"}
            </button>
            </div>
        ))}
        </div>
    </div>
    );
}