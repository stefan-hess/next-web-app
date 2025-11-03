import type { NextRequest } from 'next/server';

interface InsiderTradeEntry {
  transaction_date?: string;
  executive?: string;
  executive_title?: string;
  security_type?: string;
  acquisition_or_disposal?: string;
  shares?: string | number;
  share_price?: string | number;
  total_value?: number | null;
  ticker?: string;
}

interface AlphaVantageInsiderResponse {
  [key: string]: unknown;
}

function pickFirst<T = unknown>(obj: Record<string, unknown>, keys: string[]): T | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null) return v as T;
  }
  return undefined;
}

function extractTradesArray(data: AlphaVantageInsiderResponse): Record<string, unknown>[] {
  // Prefer keys that look like transactions lists, else fall back to first array value
  for (const key in data) {
    const val = data[key];
    if (Array.isArray(val) && /transact|insider|records|data/i.test(key)) {
      return val as Record<string, unknown>[];
    }
  }
  for (const key in data) {
    const val = data[key];
    if (Array.isArray(val)) return val as Record<string, unknown>[];
  }
  return [];
}

function normalizeTrade(raw: Record<string, unknown>, ticker: string): InsiderTradeEntry {
  const transaction_date = (pickFirst<string>(raw, [
    'transaction_date', 'transactionDate', 'filing_date', 'filingDate', 'reportedDate'
  ]) ?? undefined);
  const executive = (pickFirst<string>(raw, [
    'executive', 'insider_name', 'insiderName', 'reporting_owner', 'reportingOwner', 'ownerName', 'name'
  ]) ?? undefined);
  const executive_title = (pickFirst<string>(raw, [
    'executive_title', 'insider_title', 'insiderTitle', 'position', 'title'
  ]) ?? undefined);
  const security_type = (pickFirst<string>(raw, [
    'security_type', 'securityType', 'security', 'derivative_or_non_derivative', 'derivativeOrNonDerivative'
  ]) ?? undefined);
  const acquisition_or_disposal = (pickFirst<string>(raw, [
    'acquisition_or_disposal', 'transaction_type', 'transactionType', 'transaction', 'action', 'type'
  ]) ?? undefined);
  const shares = (pickFirst<string | number>(raw, [
    'shares', 'securities_transacted', 'securitiesTransacted', 'qty', 'change', 'shares_traded', 'sharesTraded'
  ]) ?? undefined);
  const share_price = (pickFirst<string | number>(raw, [
    'share_price', 'price', 'transaction_price', 'transactionPrice', 'avg_price', 'averagePrice'
  ]) ?? undefined);

  return {
    transaction_date,
    executive,
    executive_title,
    security_type,
    acquisition_or_disposal,
    shares,
    share_price,
    total_value: totalTradedValue(shares, share_price),
    ticker,
  };
}

function totalTradedValue(shares: string | number | undefined, sharePrice: string | number | undefined): number | null {
  const s = parseFloat(String(shares));
  const p = parseFloat(String(sharePrice));
  if (!isFinite(s) || !isFinite(p)) return null;
  return s * p;
}

async function fetchInsiderTrades(tickers: string[], apiKey: string, maxTrades = 100): Promise<InsiderTradeEntry[]> {
  const allTrades: InsiderTradeEntry[] = [];
  for (const ticker of tickers) {
    const url = `https://www.alphavantage.co/query?function=INSIDER_TRANSACTIONS&symbol=${ticker}&apikey=${apiKey}`;
    try {
      const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' }, cache: 'no-store' });
      if (!res.ok) continue;
      const data = await res.json() as AlphaVantageInsiderResponse;
      const rawTrades = extractTradesArray(data).slice(0, maxTrades);
      for (const raw of rawTrades) {
        if (raw && typeof raw === 'object') {
          allTrades.push(normalizeTrade(raw as Record<string, unknown>, ticker));
        }
      }
    } catch {
      // skip on error
    }
  }
  return allTrades;
}

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  const tickersParam = searchParams.get('tickers') || searchParams.get('ticker');
  const maxTrades = parseInt(searchParams.get('maxTrades') || '100', 10);
  if (!tickersParam || typeof tickersParam !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing or invalid tickers parameter' }), { status: 400 });
  }
  const tickers = tickersParam.split(',').map(t => t.trim()).filter(Boolean);
  if (!tickers.length) {
    return new Response(JSON.stringify({ error: 'No valid tickers provided' }), { status: 400 });
  }
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ALPHA_VANTAGE_API_KEY is not set in environment variables.' }), { status: 500 });
  }
  try {
    const trades = await fetchInsiderTrades(tickers, apiKey, maxTrades);
    return new Response(JSON.stringify(trades), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch insider trades', details: String(e) }), { status: 500 });
  }
}
