import { NextRequest, NextResponse } from "next/server"
import { getDbConnection } from "../../lib/db"

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
    const tickers = result.recordset.map((row: any) => ({ ticker: row.symbol, name: row.name }))
    return NextResponse.json(tickers)
  } catch (err) {
    console.error("Error searching tickers:", err)
    return NextResponse.json([], { status: 500 })
  }
}
