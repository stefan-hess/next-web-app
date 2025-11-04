// No special config needed for app router
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import Stripe from "stripe"

let stripe: Stripe | null = null
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    console.error("Missing STRIPE_SECRET_KEY environment variable for webhook")
    throw new Error("Stripe not configured")
  }
  if (!stripe) {
    stripe = new Stripe(key)
  }
  return stripe
}

function getServiceRoleSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error("Missing Supabase service role env vars")
  }
  return createClient(url, key)
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    if (err instanceof Error) {
      console.error("Webhook signature verification failed:", err.message, err.stack)
    } else {
      console.error("Webhook signature verification failed:", err)
    }
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
  const session = event.data.object as Stripe.Checkout.Session
  console.log("Checkout session completed:", session)
  console.log("Stripe Customer ID:", session.customer)
  console.log("Stripe Subscription ID:", session.subscription)
  console.log("Customer Email:", session.customer_email)

    try {
      const clientEmail = session.customer_email || session.metadata?.email || null;
      const firstName = session.metadata?.first_name || null;
      const lastName = session.metadata?.last_name || null;
      const extractId = (val: unknown): string | null => {
        if (typeof val === 'string') return val;
        if (val && typeof val === 'object' && 'id' in val) {
          const idVal = (val as { id?: unknown }).id;
          return typeof idVal === 'string' ? idVal : null;
        }
        return null;
      };
      const stripeCustomerId = extractId(session.customer);
      const stripeSubscriptionId = extractId(session.subscription);
      const stripePlan = session.metadata?.plan || null;
      const updatedAt = new Date().toISOString();
      const subscriptionCancelled = false;

      if (!clientEmail) {
        console.error("No customer email found in session");
        return NextResponse.json(
          { error: "No customer email found in session" },
          { status: 400 }
        );
      }

      // Upsert client in Supabase (do not update created_at)
      const supabaseService = getServiceRoleSupabase();
      const { error: upsertError } = await supabaseService
        .from("news_subscribed_clients")
        .upsert([
          {
            email: clientEmail,
            first_name: firstName,
            last_name: lastName,
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId,
            stripe_plan: stripePlan,
            updated_at: updatedAt,
            subscription_cancelled: subscriptionCancelled,
          },
        ], { onConflict: "email" });

      if (upsertError) {
        console.error("Supabase upsert failed:", upsertError.message);
        return NextResponse.json(
          { error: "Failed to update subscription in Supabase", details: upsertError.message },
          { status: 500 }
        );
      }

      console.log(`Client ${clientEmail} inserted/updated successfully in Supabase.`);
    } catch (err) {
      if (err instanceof Error) {
        console.error("Supabase update failed:", err.message, err.stack);
      } else {
        console.error("Supabase update failed:", err);
      }
      return NextResponse.json(
        { error: "Failed to update subscription in Supabase" },
        { status: 500 }
      );
    }
  }

// Handle subscription lifecycle events to keep DB in sync
try {
  if (
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.updated"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const stripeSubscriptionId = subscription.id;
    const status = subscription.status; // e.g., 'canceled', 'active', 'incomplete'

    // Decide if the subscription is considered cancelled
    const isCancelled =
      status === "canceled" || status === "incomplete_expired";

    // Update subscription_cancelled in Supabase
    const supabaseService = getServiceRoleSupabase();
    const { error: updateError } = await supabaseService
      .from("news_subscribed_clients")
      .update({
        subscription_cancelled: isCancelled,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", stripeSubscriptionId);

    if (updateError) {
      console.error("Supabase subscription update failed:", updateError.message);
      return NextResponse.json(
        { error: "Failed to update subscription state in Supabase", details: updateError.message },
        { status: 500 }
      );
    }

    console.log(
      `Updated subscription state for ${stripeSubscriptionId} in Supabase: cancelled=${isCancelled}`
    );
  }
} catch (e) {
  console.error("Error processing subscription webhook:", e);
  return NextResponse.json(
    { error: "Unhandled error processing webhook" },
    { status: 500 }
  );
}

  return NextResponse.json({ received: true })
}