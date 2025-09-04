
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-08-27.basil" });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.startsWith("http")
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

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${BASE_URL}/premium-form`,
      cancel_url: `${BASE_URL}/checkout`,
      customer_email: email,
      metadata: {
        email: email || "",
        first_name: firstName || "",
        last_name: lastName || "",
        plan: plan || "",
      },
    });

    return NextResponse.json({ id: session.id });
  } catch (err) {
    console.error("Checkout session creation failed:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}