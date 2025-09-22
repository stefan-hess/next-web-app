import { NextRequest, NextResponse } from "next/server"
import { GLOBAL_VARS } from "globalVars"
import { getDbConnection } from "../../lib/db"

export async function POST(req: NextRequest) {
  // Prefix unused vars to satisfy eslint if not needed yet
  const { first_name: _first_name, last_name: _last_name, email, tickers } = (await req.json()) as { first_name: string; last_name: string; email: string; tickers: string }
  try {
    const conn = await getDbConnection()
    const request = conn.request()
    // Check the user's plan
    const result = await request.input("email", email).query(`
  SELECT stripe_plan FROM ${GLOBAL_VARS.TABLE_NEWS_SUBSCRIBED_CLIENTS} WHERE email = @email
    `)
    const plan = result.recordset[0]?.stripe_plan
  if (plan !== "Munger" && plan !== "Buffett") {
      return NextResponse.json({ error: "You must have an active premium plan to submit this form." }, { status: 403 })
    }
    // Enforce ticker count limit based on plan
    const tickersArr = tickers.split(",").filter(Boolean)
    const maxTickers = plan === "Buffett" ? 20 : 10
    if (tickersArr.length > maxTickers) {
      return NextResponse.json({ error: `Your plan allows up to ${maxTickers} tickers. You selected ${tickersArr.length}.` }, { status: 400 })
    }
    // Remove all existing tickers for this email
    await conn.request()
      .input("email", email)
      .query(`DELETE FROM ${GLOBAL_VARS.TABLE_TICKER_SELECTION_CLIENTS} WHERE email = @email`)

    // Insert new tickers
    for (const ticker of tickersArr) {
      await conn.request()
        .input("email", email)
        .input("ticker", ticker.trim())
        .query(`INSERT INTO ${GLOBAL_VARS.TABLE_TICKER_SELECTION_CLIENTS} (email, ticker) VALUES (@email, @ticker)`)
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Premium form submission failed:", err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
