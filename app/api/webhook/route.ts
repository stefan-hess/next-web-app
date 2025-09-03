import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getDbConnection } from "../../lib/db"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
})

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!
  const body = await req.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    )
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    console.log("Checkout session completed:", session)

    try {
      const conn = await getDbConnection()
      const request = conn.request()

      const clientEmail = session.customer_email || null
      const stripeCustomerId = session.customer
      const stripeSubscriptionId = session.subscription
      const plan = session.metadata?.plan || null
      const startDate = new Date(session.created * 1000)
      const endDate = null

      if (!clientEmail) {
        console.error("No customer email found in session")
        return NextResponse.json(
          { error: "No customer email found in session" },
          { status: 400 }
        )
      }

      // Insert or update client in test_clients_stripe
      await request
        .input("email", clientEmail)
        .input("stripe_customer_id", stripeCustomerId)
        .input("stripe_subscription_id", stripeSubscriptionId)
        .input("plan", plan)
        .input("subscription_start_date", startDate)
        .input("subscription_end_date", endDate)
        .query(`
          MERGE INTO test_clients_stripe AS target
          USING (SELECT @email AS email) AS source
          ON target.email = source.email
          WHEN MATCHED THEN
            UPDATE SET
              stripe_customer_id = @stripe_customer_id,
              stripe_subscription_id = @stripe_subscription_id,
              plan = @plan,
              subscription_start_date = @subscription_start_date,
              subscription_end_date = @subscription_end_date
          WHEN NOT MATCHED THEN
            INSERT (email, stripe_customer_id, stripe_subscription_id, plan, subscription_start_date, subscription_end_date)
            VALUES (@email, @stripe_customer_id, @stripe_subscription_id, @plan, @subscription_start_date, @subscription_end_date);
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