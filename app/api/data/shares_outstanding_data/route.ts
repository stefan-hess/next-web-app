import type { NextRequest } from 'next/server';
import { isValidTicker } from '../../../lib/validateTicker';

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

// Ensure this route is always dynamic and never cached by Next.js
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function parseFloatSafe(val: string | number | undefined): number {
  const n = parseFloat(String(val));
  return isFinite(n) ? n : 0;
}

function parseDateSafe(dateStr: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Fetch a URL from AlphaVantage with throttle detection and retry logic.
 * Matches the pattern used by the fundamentals_data route.
 */
async function fetchAlphaVantage<T>(url: string): Promise<T> {
  const run = async (): Promise<T> => {
    const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' }, cache: 'no-store' });
    if (!res.ok) throw new Error(`AlphaVantage API error: ${res.status}`);
    const json = await res.json() as Record<string, unknown>;
    // Detect throttling or errors returned by Alpha Vantage
    if (json && typeof json === 'object' && (
      'Note' in json || 'Information' in json || 'Error Message' in json
    )) {
      throw new Error(`AlphaVantage throttle/error: ${String(json['Note'] || json['Information'] || json['Error Message'])}`);
    }
    return json as T;
  };

  const maxRetries = 2;
  const baseDelayMs = 500;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await run();
    } catch (err) {
      if (attempt === maxRetries) {
        console.warn('[SHARES API] AlphaVantage fetch failed after retries:', String(err));
        throw err;
      }
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  // Unreachable, but TypeScript needs it
  throw new Error('Unexpected: retry loop exited without result');
}

async function fetchSharesOutstanding(ticker: string, apiKey: string): Promise<SharesOutstandingEntry[]> {
  const url = `https://www.alphavantage.co/query?function=SHARES_OUTSTANDING&symbol=${ticker}&apikey=${apiKey}`;
  const data = await fetchAlphaVantage<AlphaVantageSharesResponse>(url);
  const sharesList: SharesOutstandingEntry[] = [];
  if (Array.isArray(data?.data)) {
    for (const entry of data.data) {
      sharesList.push({
        date: entry.date,
        shares_outstanding_basic: entry.shares_outstanding_basic,
        shares_outstanding_diluted: entry.shares_outstanding_diluted
      });
    }
  }
  return sharesList;
}

async function fetchMonthlyPrices(ticker: string, apiKey: string): Promise<Record<string, number>> {
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${ticker}&apikey=${apiKey}`;
  const data = await fetchAlphaVantage<Record<string, unknown>>(url);
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
    if (diff < minDiff && diff <= 14 * 24 * 3600 * 1000) { // within 14 days
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
  // If no shares data, return early — no need to fetch prices
  if (sharesList.length === 0) return sharesList;
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
  if (!isValidTicker(ticker)) {
    return new Response(JSON.stringify({ error: 'Invalid ticker format.' }), { status: 400 });
  }
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ALPHA_VANTAGE_API_KEY is not set in environment variables.' }), { status: 500 });
  }
  try {
    const shares = await fetchSharesOutstandingWithMarketCap(ticker, apiKey);
    console.log('[SHARES API] Requested ticker:', ticker, '| entries:', shares.length);
    return new Response(JSON.stringify({ shares_outstanding: { [ticker]: shares } }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch shares outstanding data', details: String(e) }), { status: 500 });
  }
}
