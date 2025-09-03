import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "../../lib/db"

// Use the Ticker type from the form page for type safety
// If you want to share types, consider moving this to a shared types file

type Ticker = { ticker: string; name: string }

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("query") || ""

  if (!query || query.length < 1) {
    return NextResponse.json([])
  }

  try {
    const conn = await getDbConnection()
    const request = conn.request()
    request.input("search", `%${query}%`)
    const result = await request.query(`
      SELECT TOP 10 symbol, name
      FROM dbo.listings
      WHERE (symbol LIKE @search OR name LIKE @search)
        AND status = 'Active'
      ORDER BY symbol
    `)
    // Use explicit type for row and result.recordset
    const tickers: Ticker[] = (result.recordset as { symbol: string; name: string }[]).map((row) => ({ ticker: row.symbol, name: row.name }))
    return NextResponse.json(tickers)
  } catch (err) {
    console.error("Error searching tickers:", err)
    return NextResponse.json([], { status: 500 })
  }
}
