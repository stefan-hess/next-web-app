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
  const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' }, cache: 'no-store' });
  if (!res.ok) throw new Error(`AlphaVantage API error: ${res.status}`);
  return await res.json() as AlphaVantageResponse;
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

  // Merge annual
  const annual: FinancialReport[] = [];
  for (let i = 0; i < Math.max(bsAnnual.length, incAnnual.length, cfAnnual.length); i++) {
    annual.push(computeKPIs({
      ...(bsAnnual[i] ?? {}),
      ...(incAnnual[i] ?? {}),
      ...(cfAnnual[i] ?? {})
    }));
  }
  // Merge quarterly
  const quarterly: FinancialReport[] = [];
  for (let i = 0; i < Math.max(bsQuarterly.length, incQuarterly.length, cfQuarterly.length); i++) {
    quarterly.push(computeKPIs({
      ...(bsQuarterly[i] ?? {}),
      ...(incQuarterly[i] ?? {}),
      ...(cfQuarterly[i] ?? {})
    }));
  }
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
    // Debug log: ensure correct symbol in response
    console.log('[FUNDAMENTALS API] Requested ticker:', ticker, '| Response key:', Object.keys({ [ticker]: fundamentals }));
    return new Response(JSON.stringify({ [ticker]: fundamentals }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch fundamentals data', details: String(e) }), { status: 500 });
  }
}