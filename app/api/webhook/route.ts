// No special config needed for app router
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { GLOBAL_VARS } from "globalVars"
import { getDbConnection } from "../../lib/db"

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
      const conn = await getDbConnection()
      const request = conn.request()

      const clientEmail = session.customer_email || session.metadata?.email || null
      const firstName = session.metadata?.first_name || null
      const lastName = session.metadata?.last_name || null
      // Safe extraction of possible string or object-with-id values without using 'any'
      const extractId = (val: unknown): string | null => {
        if (typeof val === 'string') return val
        if (val && typeof val === 'object' && 'id' in val) {
          const idVal = (val as { id?: unknown }).id
            return typeof idVal === 'string' ? idVal : null
        }
        return null
      }
      const stripeCustomerId = extractId(session.customer)
      const stripeSubscriptionId = extractId(session.subscription)
      const stripePlan = session.metadata?.plan || null
      const createdAt = new Date()
      const updatedAt = new Date()
      const subscriptionCancelled = false

      if (!clientEmail) {
        console.error("No customer email found in session")
        return NextResponse.json(
          { error: "No customer email found in session" },
          { status: 400 }
        )
      }

      // Insert or update client in subscribed_clients
      await request
        .input("email", clientEmail)
        .input("first_name", firstName)
        .input("last_name", lastName)
        .input("stripe_customer_id", stripeCustomerId)
        .input("stripe_subscription_id", stripeSubscriptionId)
        .input("stripe_plan", stripePlan)
        .input("created_at", createdAt)
        .input("updated_at", updatedAt)
        .input("subscription_cancelled", subscriptionCancelled)
        .query(`
          MERGE INTO ${GLOBAL_VARS.TABLE_NEWS_SUBSCRIBED_CLIENTS} AS target
          USING (SELECT @email AS email) AS source
          ON target.email = source.email
          WHEN MATCHED THEN
            UPDATE SET
              first_name = @first_name,
              last_name = @last_name,
              stripe_customer_id = @stripe_customer_id,
              stripe_subscription_id = @stripe_subscription_id,
              stripe_plan = @stripe_plan,
              updated_at = @updated_at,
              subscription_cancelled = @subscription_cancelled
          WHEN NOT MATCHED THEN
            INSERT (email, first_name, last_name, stripe_customer_id, stripe_subscription_id, stripe_plan, created_at, updated_at, subscription_cancelled)
            VALUES (@email, @first_name, @last_name, @stripe_customer_id, @stripe_subscription_id, @stripe_plan, @created_at, @updated_at, @subscription_cancelled);
        `)

      console.log(`Client ${clientEmail} inserted/updated successfully.`)
    } catch (err) {
      if (err instanceof Error) {
        console.error("Database update failed:", err.message, err.stack)
      } else {
        console.error("Database update failed:", err)
      }
      return NextResponse.json(
        { error: "Failed to update subscription in DB" },
        { status: 500 }
      )
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
      status === "canceled" || status === "incomplete_expired" ? 1 : 0;

    try {
      const conn = await getDbConnection();
      const req = conn.request();

      await req
        .input("stripe_subscription_id", stripeSubscriptionId)
        .input("subscription_cancelled", isCancelled)
        .query(`
          UPDATE ${GLOBAL_VARS.TABLE_NEWS_SUBSCRIBED_CLIENTS}
          SET subscription_cancelled = @subscription_cancelled,
              updated_at = GETDATE()
          WHERE stripe_subscription_id = @stripe_subscription_id
        `);

      console.log(
        `Updated subscription state for ${stripeSubscriptionId}: cancelled=${isCancelled}`
      );
    } catch (dbErr) {
      console.error(
        "Failed to update subscription state in DB from webhook:",
        dbErr
      );

      // **Return a 500 so Stripe retries the webhook**
      return NextResponse.json(
        { error: "Database update failed" },
        { status: 500 }
      );
    }
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