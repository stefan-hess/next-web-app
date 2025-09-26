
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

const _BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.startsWith("http")
  ? process.env.NEXT_PUBLIC_BASE_URL
  : "http://localhost:3000";

export async function POST(req: Request) {
  try {
    const { priceId, email, firstName, lastName, plan } = (await req.json()) as {
      priceId: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      plan?: string;
    };

    // Calculate trial_end (first day of next month, 00:00 UTC)
    const now = new Date();
    const trialEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
    const trialEndUnix = Math.floor(trialEnd.getTime() / 1000);

  const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
  success_url: `www.stock-ticker-news.com/payment-success`,
      cancel_url: `www.stock-ticker-news.com`,
      customer_email: email,
      metadata: {
        email: email || "",
        first_name: firstName || "",
        last_name: lastName || "",
        plan: plan || "",
      },
      subscription_data: {
        trial_end: trialEndUnix,
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