import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query");
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }
  if (query.trim().length > 50) {
    return NextResponse.json({ error: "Query too long." }, { status: 400 });
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY; // set in .env.local
  const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${apiKey}`;

  try {
    const res = await fetch(url);
    console.log("Alpha Vantage response status:", res.status);
    if (!res.ok) {
      console.error("Alpha Vantage fetch failed with status:", res.status);
      return NextResponse.json({ error: "Alpha Vantage fetch failed", status: res.status }, { status: 500 });
    }
    const data = await res.json();
    console.log("Alpha Vantage response data:", JSON.stringify(data).slice(0, 500));
    return NextResponse.json(data);
  } catch (err) {
    console.error("Alpha Vantage error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}