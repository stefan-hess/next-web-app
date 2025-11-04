// not used anymore, since only used for form and premium form which is not part of the dashboard anymore




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

  const maxRetries = 3;
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const conn = await getDbConnection();
      const request = conn.request();
      request.input("search", `%${query}%`);
      const result = await request.query(`
        SELECT TOP 10 symbol, name
        FROM dbo.listings
        WHERE (symbol LIKE @search OR name LIKE @search)
          AND status = 'Active'
        ORDER BY symbol
      `);
      const tickers: Ticker[] = (result.recordset as { symbol: string; name: string }[]).map((row) => ({ ticker: row.symbol, name: row.name }));
      return NextResponse.json(tickers);
    } catch (err) {
      lastError = err;
      if (err instanceof Error) {
        console.error(`Error searching tickers (attempt ${attempt}):`, err.message, err.stack);
      } else {
        console.error(`Error searching tickers (attempt ${attempt}):`, err);
      }
      // Wait 200ms before retrying (except after last attempt)
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  }
  return NextResponse.json({ error: "An error occurred while searching tickers after multiple attempts.", details: lastError instanceof Error ? lastError.message : String(lastError) }, { status: 500 });
}
