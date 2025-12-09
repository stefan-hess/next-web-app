
import { NextResponse } from "next/server";
import Stripe from "stripe";

let stripe: Stripe | null = null;
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("Missing STRIPE_SECRET_KEY environment variable");
    throw new Error("Stripe is not configured");
  }
  if (!stripe) {
    // Use default account API version to avoid invalid version issues
    stripe = new Stripe(key);
  }
  return stripe;
}

// Determine the absolute base URL. If an env var is provided without a scheme, prefix https://
const rawBase = process.env.NEXT_PUBLIC_BASE_URL;
const _BASE_URL = rawBase
  ? (rawBase.startsWith("http") ? rawBase : `https://${rawBase}`)
  : "http://localhost:3000";

export async function POST(req: Request) {
  try {
    const { priceId, email, firstName, lastName, plan, planLabel } = (await req.json()) as {
      priceId: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      plan?: string;
      planLabel?: string;
    };

  // Charge immediately: no trial period. If any trial is configured at the Price level,
  // override it by setting trial_end to 'now'.

  const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${_BASE_URL}/payment-success`,
      cancel_url: `${_BASE_URL}`,
      customer_email: email,
      metadata: {
        email: email || "",
        first_name: firstName || "",
        last_name: lastName || "",
        // Keep canonical plan for backend logic and webhooks
        plan: plan || "",
        // Add display label for analytics/auditing (e.g., basic/Pro)
        plan_label: planLabel || (plan === 'Munger' ? 'Basic' : plan === 'Buffett' ? 'Pro' : (plan || '')),
      },
    });

    return NextResponse.json({ id: session.id });
  } catch (err) {
    if (err instanceof Error) {
      console.error("Checkout session creation failed:", err.message, err.stack);
    } else {
      console.error("Checkout session creation failed:", err);
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}