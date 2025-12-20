import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchAlphaVantageJson(url: string): Promise<Record<string, unknown>> {
  const run = async () => {
    const res = await fetch(url, { headers: { "User-Agent": "request" }, cache: 'no-store' });
    if (!res.ok) throw new Error(`Alpha Vantage error: ${res.status}`);
    const json = await res.json() as Record<string, unknown>;
    if (json && ("Note" in json || "Information" in json || "Error Message" in json)) {
      throw new Error(String(json["Note"] || json["Information"] || json["Error Message"]))
    }
    return json;
  };
  const maxRetries = 2;
  const baseDelay = 500;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try { return await run(); } catch (err) {
      if (attempt === maxRetries) {
        console.warn('[MARKETCAP API] Overview fetch failed after retries:', String(err));
        return {};
      }
      await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt)));
    }
  }
  return {};
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let symbol = searchParams.get("symbol");
  if (!symbol) {
    return new Response(JSON.stringify({ error: "Missing symbol" }), { status: 400 });
  }
  symbol = symbol.toUpperCase();
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY || "demo";
  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;
  try {
    const data = await fetchAlphaVantageJson(url);
    const marketCap = (data as { MarketCapitalization?: string }).MarketCapitalization || "";
    let currency = (data as { Currency?: string }).Currency || "";
    // If currency missing but market cap present, default to USD to allow display
    if (!currency && marketCap) currency = 'USD';
    return new Response(JSON.stringify({ marketCap, currency, raw: data }), {
      status: 200,
      headers: { 'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate', 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Fetch error", details: String(err) }), { status: 500 });
  }
}
