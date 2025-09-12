import { NextRequest, NextResponse } from "next/server"
import { GLOBAL_VARS } from "globalVars"
import { getDbConnection } from "../../lib/db"

export async function POST(req: NextRequest) {
  const { email } = (await req.json()) as { email: string }
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })
  try {
    const conn = await getDbConnection()
    const request = conn.request()
    const result = await request.input("email", email).query(`
      SELECT stripe_plan, subscription_cancelled FROM ${GLOBAL_VARS.TABLE_STRIPE_CLIENTS} WHERE email = @email
    `)
    const row = result.recordset[0]
    if (!row || row.subscription_cancelled === true) {
      return NextResponse.json({ plan: null })
    }
    return NextResponse.json({ plan: row.stripe_plan || null })
  } catch (err) {
    if (err instanceof Error) {
      console.error("Get Stripe plan failed:", err.message, err.stack)
    } else {
      console.error("Get Stripe plan failed:", err)
    }
    return NextResponse.json({ error: "Failed to get plan", details: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
