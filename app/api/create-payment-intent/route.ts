import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getDbConnection } from "../../lib/db"

export async function POST(req: Request) {
  const { amount, currency = "usd", plan, first_name, last_name, email } = (await req.json()) as { amount: number; currency?: string; plan: string; first_name: string; last_name: string; email: string }
  if (!first_name || !last_name || !email || !plan) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 })
  }
  // Normalize plan value to ensure only 'monger' or 'buffett' is stored
  const normalizedPlan = plan === "buffett" ? "buffett" : "monger"
  try {
    const conn = await getDbConnection()
    const request = conn.request()
    await request
      .input("email", email)
      .input("stripe_plan", normalizedPlan)
      .input("first_name", first_name)
      .input("last_name", last_name)
      .query(`
        MERGE INTO test_clients_stripe AS target
        USING (SELECT @email AS email) AS source
        ON target.email = source.email
        WHEN MATCHED THEN
          UPDATE SET stripe_plan = @stripe_plan, first_name = @first_name, last_name = @last_name
        WHEN NOT MATCHED THEN
          INSERT (email, stripe_plan, first_name, last_name)
          VALUES (@email, @stripe_plan, @first_name, @last_name);
      `)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-08-27.basil" })
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: { plan: normalizedPlan, first_name, last_name, email },
    })
    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    console.error("PaymentIntent creation failed:", err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
