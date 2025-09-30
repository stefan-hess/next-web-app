import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  if (!symbol) {
    return new Response(JSON.stringify({ error: "Missing symbol" }), { status: 400 });
  }
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY || "demo";
  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "request"
      }
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Alpha Vantage error", status: res.status }), { status: res.status });
    }
  const data = await res.json();
  const marketCap = (data as { MarketCapitalization?: string }).MarketCapitalization || "";
  const currency = (data as { Currency?: string }).Currency || "";
  return new Response(JSON.stringify({ marketCap, currency, raw: data }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Fetch error", details: String(err) }), { status: 500 });
  }
}
