
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { GLOBAL_VARS } from "globalVars"
import { getDbConnection } from "../../lib/db"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: GLOBAL_VARS.STRIPE_API_VERSION as "2025-08-27.basil" })

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email: string }
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 })
    }
    const conn = await getDbConnection()
    // Get the user's Stripe subscription ID
    const result = await conn.request()
      .input("email", email)
      .query("SELECT stripe_subscription_id FROM news_subscribed_clients WHERE email = @email")
    const subscriptionId = result.recordset[0]?.stripe_subscription_id
    if (!subscriptionId) {
      return NextResponse.json({ error: "No Stripe subscription found for this user." }, { status: 404 })
    }
    // Cancel the Stripe subscription at period end
    await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })
    // Mark as cancelled in your DB
    await conn.request()
      .input("email", email)
      .query(`
        UPDATE news_subscribed_clients
        SET subscription_cancelled = TRUE
        WHERE email = @email
      `)
    return NextResponse.json({ message: "Unsubscribed successfully." })
  } catch (err) {
    if (err instanceof Error) {
      console.error("Unsubscribe error:", err.message, err.stack)
    } else {
      console.error("Unsubscribe error:", err)
    }
    return NextResponse.json({ error: "An error occurred while unsubscribing.", details: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
