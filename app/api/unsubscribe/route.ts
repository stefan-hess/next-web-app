
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { GLOBAL_VARS } from "globalVars"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: GLOBAL_VARS.STRIPE_API_VERSION as "2025-08-27.basil" })

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email: string }
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 })
    }
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    // Get the user's Stripe subscription ID
    const { data, error } = await supabase
      .from(GLOBAL_VARS.TABLE_NEWS_SUBSCRIBED_CLIENTS)
      .select("stripe_subscription_id")
      .eq("email", email)
      .single()
    if (error) {
      throw error
    }
    const subscriptionId = data?.stripe_subscription_id
    if (!subscriptionId) {
      return NextResponse.json({ error: "No Stripe subscription found for this user." }, { status: 404 })
    }
    // Cancel the Stripe subscription at period end
    await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })
    // Mark as cancelled in Supabase
    const { error: updateError } = await supabase
      .from(GLOBAL_VARS.TABLE_NEWS_SUBSCRIBED_CLIENTS)
      .update({ subscription_cancelled: true })
      .eq("email", email)
    if (updateError) {
      throw updateError
    }
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
