import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-08-27.basil" });

export async function POST(req: Request) {
    try {
    // Parse and type the request body
    const { priceId } = (await req.json()) as { priceId: string };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription", // For recurring SaaS payments
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
    });

    return NextResponse.json({ id: session.id });
    } catch (err) {
    console.error("Checkout session creation failed:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}