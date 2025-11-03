import type { NextRequest } from 'next/server';

interface SharesOutstandingEntry {
  date?: string;
  shares_outstanding_basic?: string | number;
  shares_outstanding_diluted?: string | number;
  market_cap_undiluted?: number | null;
  market_cap_diluted?: number | null;
}

interface AlphaVantageSharesResponse {
  data?: SharesOutstandingEntry[];
  shares_outstanding_basic?: string | number;
  shares_outstanding_diluted?: string | number;
  [key: string]: unknown;
}

function parseFloatSafe(val: string | number | undefined): number {
  const n = parseFloat(String(val));
  return isFinite(n) ? n : 0;
}

function parseDateSafe(dateStr: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

async function fetchSharesOutstanding(ticker: string, apiKey: string): Promise<SharesOutstandingEntry[]> {
  const url = `https://www.alphavantage.co/query?function=SHARES_OUTSTANDING&symbol=${ticker}&apikey=${apiKey}`;
  const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' }, cache: 'no-store' });
  if (!res.ok) throw new Error(`AlphaVantage API error: ${res.status}`);
  const data = await res.json() as AlphaVantageSharesResponse;
  const sharesList: SharesOutstandingEntry[] = [];
  if (Array.isArray(data?.data)) {
    for (const entry of data.data) {
      sharesList.push({
        date: entry.date,
        shares_outstanding_basic: entry.shares_outstanding_basic,
        shares_outstanding_diluted: entry.shares_outstanding_diluted
      });
    }
  } else {
    const today = new Date().toISOString().slice(0, 10);
    sharesList.push({
      date: today,
      shares_outstanding_basic: data.shares_outstanding_basic,
      shares_outstanding_diluted: data.shares_outstanding_diluted
    });
  }
  return sharesList;
}

async function fetchMonthlyPrices(ticker: string, apiKey: string): Promise<Record<string, number>> {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${ticker}&apikey=${apiKey}`;
  const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' }, cache: 'no-store' });
  if (!res.ok) throw new Error(`AlphaVantage API error: ${res.status}`);
  const data = await res.json() as { [key: string]: unknown };
  const monthlySeries = (data['Monthly Time Series'] as Record<string, { '4. close': string | number }> | undefined) || {};
  const closePriceByDate: Record<string, number> = {};
  for (const date in monthlySeries) {
    const entry = monthlySeries[date];
    if (entry && typeof entry['4. close'] !== 'undefined') {
      closePriceByDate[date] = parseFloatSafe(entry['4. close']);
    }
  }
  return closePriceByDate;
}

function findClosestPrice(dateStr: string, closePriceByDate: Record<string, number>): number | null {
  const entryDt = parseDateSafe(dateStr);
  if (!entryDt) return typeof closePriceByDate[dateStr] === 'number' ? closePriceByDate[dateStr] : null;
  let bestDate: string | null = null;
  let minDiff = Infinity;
  for (const d in closePriceByDate) {
    const dt = parseDateSafe(d);
    if (!dt) continue;
    const diff = Math.abs(dt.getTime() - entryDt.getTime());
    if (diff < minDiff && diff <= 10 * 24 * 3600 * 1000) { // within 10 days
      minDiff = diff;
      bestDate = d;
    }
  }
  if (!bestDate) return null;
  const val = closePriceByDate[bestDate];
  return typeof val === 'number' ? val : null;
}

async function fetchSharesOutstandingWithMarketCap(ticker: string, apiKey: string): Promise<SharesOutstandingEntry[]> {
  const sharesList = await fetchSharesOutstanding(ticker, apiKey);
  const closePriceByDate = await fetchMonthlyPrices(ticker, apiKey);
  for (const entry of sharesList) {
    const closePrice = findClosestPrice(entry.date ?? '', closePriceByDate);
    const basic = parseFloatSafe(entry.shares_outstanding_basic);
    const diluted = parseFloatSafe(entry.shares_outstanding_diluted);
    entry.market_cap_undiluted = closePrice !== null ? basic * closePrice : null;
    entry.market_cap_diluted = closePrice !== null ? diluted * closePrice : null;
  }
  return sharesList;
}

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get('ticker');
  if (!ticker || typeof ticker !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing or invalid ticker parameter' }), { status: 400 });
  }
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ALPHA_VANTAGE_API_KEY is not set in environment variables.' }), { status: 500 });
  }
  try {
    const shares = await fetchSharesOutstandingWithMarketCap(ticker, apiKey);
    return new Response(JSON.stringify({ shares_outstanding: { [ticker]: shares } }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch shares outstanding data', details: String(e) }), { status: 500 });
  }
}
