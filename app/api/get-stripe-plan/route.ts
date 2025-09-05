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
      SELECT stripe_plan FROM ${GLOBAL_VARS.TABLE_STRIPE_CLIENTS} WHERE email = @email
    `)
    const plan = result.recordset[0]?.stripe_plan || null
    return NextResponse.json({ plan })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
