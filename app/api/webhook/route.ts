// No special config needed for app router
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getDbConnection } from "../../lib/db"
import { GLOBAL_VARS } from "globalVars"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
})

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!
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
      const stripeCustomerId = typeof session.customer === 'string' ? session.customer : (session.customer as any)?.id || null
      const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : (session.subscription as any)?.id || null
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
          MERGE INTO ${GLOBAL_VARS.TABLE_STRIPE_CLIENTS} AS target
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
      console.error("Database update failed:", err)
      return NextResponse.json(
        { error: "Failed to update subscription in DB" },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ received: true })
}