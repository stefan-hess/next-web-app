import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "../../lib/db"

export async function POST(req: NextRequest) {
  try {
    const { email, feedback } = (await req.json()) as { email: string; feedback: string }
    if (!email || !feedback) {
      return NextResponse.json({ error: "Email and feedback are required." }, { status: 400 })
    }
    const conn = await getDbConnection()
    await conn.request()
      .input("email", email)
      .input("feedback", feedback)
      .query(`
        INSERT INTO feedback (email, feedback)
        VALUES (@email, @feedback)
      `)
    return NextResponse.json({ message: "Feedback submitted successfully." })
  } catch (err) {
    if (err instanceof Error) {
      console.error("Feedback submission error:", err.message, err.stack)
    } else {
      console.error("Feedback submission error:", err)
    }
    return NextResponse.json({ error: "An error occurred while submitting feedback.", details: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
