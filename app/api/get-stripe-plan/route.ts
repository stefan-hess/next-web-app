import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { GLOBAL_VARS } from "globalVars"

export async function POST(req: NextRequest) {
  const { email } = (await req.json()) as { email: string }
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data, error } = await supabase
      .from(GLOBAL_VARS.TABLE_NEWS_SUBSCRIBED_CLIENTS)
      .select("stripe_plan, subscription_cancelled")
      .eq("email", email)
      .single()
    if (error) {
      throw error
    }
    if (!data || data.subscription_cancelled === true) {
      return NextResponse.json({ plan: null })
    }
    return NextResponse.json({ plan: data.stripe_plan || null })
  } catch (err) {
    if (err instanceof Error) {
      console.error("Get Stripe plan failed:", err.message, err.stack)
    } else {
      console.error("Get Stripe plan failed:", err)
    }
    return NextResponse.json({ error: "Failed to get plan", details: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}