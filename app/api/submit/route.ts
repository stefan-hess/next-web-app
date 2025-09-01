import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "../../../lib/db"

type SubmitBody = {
  first_name: string
  last_name: string
  email: string
  tickers?: string[] | string
  feedback?: string
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SubmitBody
  const { first_name, last_name, email, tickers, feedback } = body

  // Validate required fields
  if (!first_name || !last_name || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const conn = await getDbConnection()
  const transaction = conn.transaction()

  try {
    await transaction.begin()
    const request = transaction.request()

    // Check if client exists
    const existingClient = await request
      .input("email", email)
      .query("SELECT email FROM news_subscribed_clients WHERE email = @email")

    if (existingClient.recordset.length > 0) {
      await request.input("first_name", first_name).input("last_name", last_name).input("email", email).query(`
          UPDATE news_subscribed_clients
          SET first_name = @first_name, last_name = @last_name, subscription_cancelled = 0
          WHERE email = @email
        `)
    } else {
      await request.input("first_name", first_name).input("last_name", last_name).input("email", email).query(`
          INSERT INTO news_subscribed_clients (first_name, last_name, email, subscription_cancelled)
          VALUES (@first_name, @last_name, @email, 0)
        `)
    }

    // Reset tickers
    await request.input("email", email).query("DELETE FROM ticker_selection_clients WHERE email = @email")

    // Insert tickers
    if (tickers) {
      const tickerList = Array.isArray(tickers) ? tickers : tickers.split(",")
      for (const ticker of tickerList) {
        await request.input("email", email).input("ticker", ticker).query(`
          INSERT INTO ticker_selection_clients (email, ticker)
          VALUES (@email, @ticker)
        `)
      }
    }

    // Insert feedback
    if (feedback && feedback.trim()) {
      await request.input("email", email).input("feedback", feedback).query(`
        INSERT INTO feedback (email, feedback)
        VALUES (@email, @feedback)
      `)
    }

    await transaction.commit()
    return NextResponse.json({ message: "Form submitted successfully!" })
  } catch (err) {
    await transaction.rollback()
    console.error("Error processing form:", err)
    return NextResponse.json({ error: "An error occurred while processing your form." }, { status: 500 })
  }
}
