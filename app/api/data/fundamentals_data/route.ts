import type { NextRequest } from 'next/server';
import { GLOBAL_VARS } from 'globalVars';

interface FinancialReport {
  [key: string]: string | number | null | undefined;
}

interface AlphaVantageResponse {
  annualReports?: FinancialReport[];
  quarterlyReports?: FinancialReport[];
  [key: string]: unknown;
}

const fetched_quarters = GLOBAL_VARS.FETCHED_FUNDAMENTAL_QUARTERS;
const fetched_years = GLOBAL_VARS.FETCHED_FUNDAMENTAL_YEARS;

// Ensure this route is always dynamic and never cached by Next.js
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function safeDiv(a: string | number | null | undefined, b: string | number | null | undefined): number | null {
  const x = parseFloat(String(a));
  const y = parseFloat(String(b));
  if (!isFinite(x) || !isFinite(y) || y === 0) return null;
  return x / y;
}

function safeSum(...args: (string | number | null | undefined)[]): number | null {
  let sum = 0;
  for (const v of args) {
    const n = parseFloat(String(v));
    if (!isFinite(n)) return null;
    sum += n;
  }
  return sum;
}

function computeKPIs(report: FinancialReport): FinancialReport {
  return {
    ...report,
    gross_margin: safeDiv(report.grossProfit, report.totalRevenue),
    operating_margin: safeDiv(report.operatingIncome, report.totalRevenue),
    net_profit_margin: safeDiv(report.netIncome, report.totalRevenue),
    ebitda_margin: safeDiv(report.ebitda, report.totalRevenue),
    roa: safeDiv(report.netIncome, report.totalAssets),
    roe: safeDiv(report.netIncome, report.totalShareholderEquity),
    roic: (() => {
      const total_debt = safeSum(report.shortTermDebt, report.longTermDebt);
      const denominatorSum = safeSum(total_debt, report.totalShareholderEquity);
  const cash = parseFloat(String(report.cashAndCashEquivalentsAtCarryingValue ?? '0'));
      const denominator = (denominatorSum !== null ? denominatorSum : 0) - (isFinite(cash) ? cash : 0);
      return safeDiv(report.ebit, denominator);
    })(),
    current_ratio: safeDiv(report.totalCurrentAssets, report.totalCurrentLiabilities),
    quick_ratio: (() => {
      const quick_assets = safeSum(report.cashAndCashEquivalentsAtCarryingValue, report.shortTermInvestments, report.currentNetReceivables);
      return safeDiv(quick_assets, report.totalCurrentLiabilities);
    })(),
    cash_ratio: safeDiv(report.cashAndCashEquivalentsAtCarryingValue, report.totalCurrentLiabilities),
    working_capital: (() => {
  const a = parseFloat(String(report.totalCurrentAssets ?? 'NaN'));
  const l = parseFloat(String(report.totalCurrentLiabilities ?? 'NaN'));
      return isFinite(a) && isFinite(l) ? a - l : null;
    })(),
    inventory_turnover: safeDiv(report.costOfRevenue, report.inventory),
    receivables_turnover: safeDiv(report.totalRevenue, report.currentNetReceivables),
    asset_turnover: safeDiv(report.totalRevenue, report.totalAssets),
    debt_to_equity_ratio: safeDiv(report.totalLiabilities, report.totalShareholderEquity),
    debt_ratio: safeDiv(report.totalLiabilities, report.totalAssets),
    interest_coverage_ratio: safeDiv(report.ebit, report.interestExpense),
    equity_multiplier: safeDiv(report.totalAssets, report.totalShareholderEquity),
    operating_cash_flow_margin: safeDiv(report.operatingCashflow, report.totalRevenue),
    free_cash_flow: (() => {
  const ocf = parseFloat(String(report.operatingCashflow ?? 'NaN'));
  const capex = parseFloat(String(report.capitalExpenditures ?? 'NaN'));
      return isFinite(ocf) && isFinite(capex) ? ocf - capex : null;
    })(),
  };
}

async function fetchAlphaVantage(url: string): Promise<AlphaVantageResponse> {
  const run = async (): Promise<AlphaVantageResponse> => {
    const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' }, cache: 'no-store' });
    if (!res.ok) throw new Error(`AlphaVantage API error: ${res.status}`);
    const json = await res.json() as Record<string, unknown>;
    // Detect throttling or errors returned by Alpha Vantage
    if (json && typeof json === 'object' && (
      'Note' in json || 'Information' in json || 'Error Message' in json
    )) {
      throw new Error(`AlphaVantage response indicates throttle or error: ${String(json['Note'] || json['Information'] || json['Error Message'])}`);
    }
    return json as AlphaVantageResponse;
  };

  const maxRetries = 2;
  const baseDelayMs = 500;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await run();
    } catch (err) {
      if (attempt === maxRetries) {
        console.warn('[FUNDAMENTALS API] AlphaVantage fetch failed after retries:', String(err));
        // Return empty to allow partial data response instead of failing entire request
        return { annualReports: [], quarterlyReports: [] };
      }
      // Exponential backoff
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  return { annualReports: [], quarterlyReports: [] };
}

async function fetchFundamentals(ticker: string, apiKey: string): Promise<{ annual: FinancialReport[]; quarterly: FinancialReport[] }> {
  // Fetch balance sheet
  const bsUrl = `https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=${ticker}&apikey=${apiKey}`;
  const bsData = await fetchAlphaVantage(bsUrl);
  const bsAnnual = bsData.annualReports?.slice(0, fetched_years) ?? [];
  const bsQuarterly = bsData.quarterlyReports?.slice(0, fetched_quarters) ?? [];

  // Fetch income statement
  const incUrl = `https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${apiKey}`;
  const incData = await fetchAlphaVantage(incUrl);
  const incAnnual = incData.annualReports?.slice(0, fetched_years) ?? [];
  const incQuarterly = incData.quarterlyReports?.slice(0, fetched_quarters) ?? [];

  // Fetch cashflow
  const cfUrl = `https://www.alphavantage.co/query?function=CASH_FLOW&symbol=${ticker}&apikey=${apiKey}`;
  const cfData = await fetchAlphaVantage(cfUrl);
  const cfAnnual = cfData.annualReports?.slice(0, fetched_years) ?? [];
  const cfQuarterly = cfData.quarterlyReports?.slice(0, fetched_quarters) ?? [];

  // Build maps keyed by fiscalDateEnding for robust joining
  const mapByDate = (rows: FinancialReport[]) => {
    const m = new Map<string, FinancialReport>();
    for (const r of rows) {
      const key = String((r as Record<string, unknown>)['fiscalDateEnding'] ?? '');
      if (key) m.set(key, r);
    }
    return m;
  };

  const bsAnnualMap = mapByDate(bsAnnual);
  const incAnnualMap = mapByDate(incAnnual);
  const cfAnnualMap = mapByDate(cfAnnual);
  const bsQuarterlyMap = mapByDate(bsQuarterly);
  const incQuarterlyMap = mapByDate(incQuarterly);
  const cfQuarterlyMap = mapByDate(cfQuarterly);

  const sortDatesDesc = (dates: string[]) => {
    return dates.sort((a, b) => {
      const ad = new Date(a).getTime();
      const bd = new Date(b).getTime();
      if (isNaN(ad) || isNaN(bd)) return b.localeCompare(a);
      return bd - ad;
    });
  };

  // Merge annual by date
  const annualDates = Array.from(new Set<string>([
    ...Array.from(bsAnnualMap.keys()),
    ...Array.from(incAnnualMap.keys()),
    ...Array.from(cfAnnualMap.keys()),
  ]));
  const annual: FinancialReport[] = sortDatesDesc(annualDates)
    .slice(0, fetched_years)
    .map((d) => computeKPIs({
      ...(bsAnnualMap.get(d) ?? {}),
      ...(incAnnualMap.get(d) ?? {}),
      ...(cfAnnualMap.get(d) ?? {})
    }));

  // Merge quarterly by date
  const quarterlyDates = Array.from(new Set<string>([
    ...Array.from(bsQuarterlyMap.keys()),
    ...Array.from(incQuarterlyMap.keys()),
    ...Array.from(cfQuarterlyMap.keys()),
  ]));
  const quarterly: FinancialReport[] = sortDatesDesc(quarterlyDates)
    .slice(0, fetched_quarters)
    .map((d) => computeKPIs({
      ...(bsQuarterlyMap.get(d) ?? {}),
      ...(incQuarterlyMap.get(d) ?? {}),
      ...(cfQuarterlyMap.get(d) ?? {})
    }));
  return { annual, quarterly };
}

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);
  let ticker = searchParams.get('ticker');
  if (!ticker || typeof ticker !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing or invalid ticker parameter' }), { status: 400 });
  }
  ticker = ticker.toUpperCase(); // Normalize symbol
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ALPHA_VANTAGE_API_KEY is not set in environment variables.' }), { status: 500 });
  }
  try {
    const fundamentals = await fetchFundamentals(ticker, apiKey);
    // Debug log: ensure correct symbol and dataset coverage
    console.log('[FUNDAMENTALS API] Requested ticker:', ticker,
      '| annual entries:', fundamentals.annual?.length ?? 0,
      '| quarterly entries:', fundamentals.quarterly?.length ?? 0);
    return new Response(
      JSON.stringify({ [ticker]: fundamentals }),
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch fundamentals data', details: String(e) }), { status: 500 });
  }
}