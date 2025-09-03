import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getDbConnection } from "../../lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!;
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Grab subscription info
      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;
      const email = session.customer_email!;
      const plan = session.metadata?.plan || "default_plan";
      const status = "active";

      // Store in DB
      const conn = await getDbConnection();
      const request = conn.request();

      // Check if subscription exists
      const existing = await request
        .input("email", email)
        .query(
          "SELECT * FROM subscriptions WHERE email = @email AND stripe_subscription_id = @subscriptionId"
        );

      if (existing.recordset.length > 0) {
        // Update existing subscription
        await request
          .input("email", email)
          .input("subscriptionId", subscriptionId)
          .input("customerId", customerId)
          .input("plan", plan)
          .input("status", status)
          .query(`
            UPDATE subscriptions
            SET stripe_customer_id = @customerId,
                plan = @plan,
                status = @status,
                updated_at = GETDATE()
            WHERE email = @email AND stripe_subscription_id = @subscriptionId
          `);
      } else {
        // Insert new subscription
        await request
          .input("email", email)
          .input("subscriptionId", subscriptionId)
          .input("customerId", customerId)
          .input("plan", plan)
          .input("status", status)
          .query(`
            INSERT INTO subscriptions (email, stripe_customer_id, stripe_subscription_id, plan, status)
            VALUES (@email, @customerId, @subscriptionId, @plan, @status)
          `);
      }

      console.log(`Subscription processed for ${email}: ${plan}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Error processing subscription:", err);
    return NextResponse.json(
      { error: "Failed to process subscription" },
      { status: 500 }
    );
  }
}