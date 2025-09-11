import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "../../lib/db"

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email: string }
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 })
    }
    const conn = await getDbConnection()
    await conn.request()
      .input("email", email)
      .query(`
        UPDATE news_subscribed_clients
        SET subscription_cancelled = 1
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
