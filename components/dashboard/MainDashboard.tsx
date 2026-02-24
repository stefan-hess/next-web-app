"use client";
import { Activity, BarChart3, DollarSign, ScrollText } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "app/lib/supabaseClient";
import { useCachedFinancialData } from "app/lib/useCachedFinancialData";
import { useDividendData } from "app/lib/useDividendData";
import { useInsiderTradesData } from "app/lib/useInsiderTradesData";
import { useLatestNews } from "app/lib/useLatestNews";
import { useSharesOutstandingData } from "app/lib/useSharesOutstandingData";
import type { Ticker } from "./Dashboard";
import { FinancialCard } from "./FinancialCard";

// All available fields per financial statement category
const BALANCE_SHEET_FIELDS = [
  'totalAssets', 'totalCurrentAssets', 'cashAndCashEquivalentsAtCarryingValue',
  'cashAndShortTermInvestments', 'inventory', 'currentNetReceivables',
  'totalNonCurrentAssets', 'propertyPlantEquipment', 'goodwill',
  'intangibleAssets', 'longTermInvestments', 'shortTermInvestments',
  'totalLiabilities', 'totalCurrentLiabilities', 'currentAccountsPayable',
  'shortTermDebt', 'longTermDebt', 'totalNonCurrentLiabilities',
  'totalShareholderEquity', 'retainedEarnings', 'commonStock',
] as const;

const INCOME_STATEMENT_FIELDS = [
  'totalRevenue', 'grossProfit', 'costOfRevenue', 'operatingIncome',
  'sellingGeneralAndAdministrative', 'researchAndDevelopment', 'operatingExpenses',
  'interestExpense', 'depreciation', 'depreciationAndAmortization',
  'incomeBeforeTax', 'incomeTaxExpense', 'ebit', 'ebitda', 'netIncome',
] as const;

const CASH_FLOW_FIELDS = [
  'operatingCashflow', 'capitalExpenditures', 'cashflowFromInvestment',
  'cashflowFromFinancing', 'depreciationDepletionAndAmortization',
  'dividendPayout', 'changeInReceivables', 'changeInInventory',
  'proceedsFromIssuanceOfCommonStock', 'changeInCashAndCashEquivalents',
] as const;



interface ClientData {
  annual?: unknown[];
  quarterly?: unknown[];
  shares?: unknown[];
  news?: unknown[];
  insider?: unknown[];
  dividends?: unknown[];
}

interface MainDashboardProps {
  ticker: Ticker;
  marketCap?: string;
  marketCapCurrency?: string;
  onProvideAssistantData?: (clientData: ClientData) => void;
}

export const MainDashboard = ({ ticker, marketCap, marketCapCurrency, onProvideAssistantData }: MainDashboardProps) => {
  // Sentiment tab state
  // Periods toggle state
  const [periodOptions, setPeriodOptions] = useState<number[]>([5, 10, 15, 20]);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(10);
  const [stripePlan, setStripePlan] = useState<string | null>(null);

  // Fetch stripe plan for current user
  useEffect(() => {
    async function fetchStripePlan() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        if (error.message.includes("Refresh Token Not Found") || error.message.includes("Invalid Refresh Token")) {
          await supabase.auth.signOut();
        }
        return;
      }
      if (!user || !user.email) return;
      try {
        const res = await fetch('/api/get-stripe-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email })
        });
        const json = await res.json() as { plan?: string };
        if (json && typeof json === 'object' && 'plan' in json) {
          setStripePlan(json.plan ?? null);
          if (json.plan === 'Munger' || json.plan == null) {
            setPeriodOptions([5, 10]);
            if (!([5, 10].includes(selectedPeriod))) setSelectedPeriod(5);
          } else {
            setPeriodOptions([5, 10, 15, 20]);
          }
        }
      } catch {
        // fallback: show all options
        setPeriodOptions([5, 10, 15, 20]);
      }
    }
    fetchStripePlan();
  }, []);
  interface SentimentFeedItem {
    time_published?: string;
    overall_sentiment_score?: number | string;
    title?: string;
    headline?: string;
    source?: string;
    [key: string]: unknown;
  }
  const [sentimentData, setSentimentData] = useState<SentimentFeedItem[] | null>(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [sentimentError, setSentimentError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker?.symbol) return;
    setSentimentLoading(true);
    setSentimentError(null);
    fetch(`/api/data/sentiment_data?ticker=${ticker.symbol}`)
      .then(res => res.json())
      .then(json => {
  const result = (json && typeof json === 'object' && ticker.symbol in json) ? (json as Record<string, { feed?: SentimentFeedItem[] }>)[ticker.symbol] : null;
  setSentimentData(result?.feed ?? []);
        setSentimentLoading(false);
      })
      .catch((_err) => {
        setSentimentError('Failed to fetch sentiment data');
        setSentimentLoading(false);
      });
  }, [ticker.symbol]);
  // Request up to 1000 trades to display more history
  const { data: insiderData, loading: insiderLoading, error: insiderError } = useInsiderTradesData(ticker.symbol, 1000);
  // Set default expanded state for all financial cards
  const financialCategoryIds = ["balance-sheet", "income-statement", "cash-flow"];
  const [expandedCards, setExpandedCards] = useState<string[]>(financialCategoryIds);
  const DEFAULT_SELECTED_FIELDS: Record<string, string[]> = {
    'balance-sheet': ['totalAssets', 'totalLiabilities', 'totalShareholderEquity'],
    'income-statement': ['totalRevenue', 'costOfRevenue', 'ebitda', 'netIncome'],
    'cash-flow': ['operatingCashflow', 'cashflowFromInvestment', 'cashflowFromFinancing'],
  };
  const [selectedFields, setSelectedFields] = useState<Record<string, string[]>>(DEFAULT_SELECTED_FIELDS);
  const [period, setPeriod] = useState<'annual' | 'quarterly'>('annual');
  const [view, setView] = useState<'table' | 'chart'>('table');
  const [activeTab, setActiveTab] = useState<'fundamentals' | 'shares' | 'insider' | 'dividends' | 'latest' | 'kpi' | 'reports' | 'sentiment'>('fundamentals');
  const { news, loading: newsLoading, error: newsError } = useLatestNews(ticker.symbol);
  const { data: dividendData, loading: dividendLoading, error: dividendError } = useDividendData(ticker.symbol);
  const { data, loading, error } = useCachedFinancialData(ticker.symbol);
  // Debug: log raw fundamentals data
  useEffect(() => {
    if (data) {
      console.log('[DEBUG] Raw fundamentals data for', ticker.symbol, data);
    }
  }, [data, ticker.symbol]);
  const periodData = data?.[ticker.symbol]?.[period] || [];
  // Full extracts for reports tab
  const fullQuarterlyData = data?.[ticker.symbol]?.quarterly || [];
  const fullAnnualData = data?.[ticker.symbol]?.annual || [];
  const { data: sharesData, loading: sharesLoading, error: sharesError } = useSharesOutstandingData(ticker.symbol);
  // Debug: log raw shares outstanding data
  useEffect(() => {
    if (sharesData) {
      console.log('[DEBUG] Raw shares outstanding data for', ticker.symbol, sharesData);
    }
  }, [sharesData, ticker.symbol]);
  // Debug: log raw dividend data
  useEffect(() => {
    if (dividendData) {
      console.log('[DEBUG] Raw dividend data for', ticker.symbol, dividendData);
    }
  }, [dividendData, ticker.symbol]);

  // Provide cached data to parent for assistant (guarded to avoid update loops)
  const onProvideAssistantDataRef = useRef(onProvideAssistantData);
  useEffect(() => { onProvideAssistantDataRef.current = onProvideAssistantData; }, [onProvideAssistantData]);
  const lastAssistantPayloadRef = useRef<string>("");
  useEffect(() => {
    const payload = {
      annual: fullAnnualData,
      quarterly: fullQuarterlyData,
      shares: Array.isArray(sharesData) ? sharesData : [],
      news: Array.isArray(news) ? news : [],
      insider: Array.isArray(insiderData) ? insiderData.filter(Boolean) : [],
      dividends: Array.isArray(dividendData) ? dividendData : [],
    } as const;
    // Serialize to detect real content changes; avoids new object identity each render
    let snapshot = "";
    try {
      snapshot = JSON.stringify(payload);
    } catch {
      // Fallback: if serialization fails, still try to send once
      snapshot = Math.random().toString(36);
    }
    if (snapshot !== lastAssistantPayloadRef.current) {
      lastAssistantPayloadRef.current = snapshot;
      if (onProvideAssistantDataRef.current) {
        onProvideAssistantDataRef.current(payload as unknown as ClientData);
      }
    }
  }, [fullAnnualData, fullQuarterlyData, sharesData, news, insiderData, dividendData]);

  // Prepare filtered Shares Outstanding data based on toggle (quarterly vs annual)
  const getFilteredSharesData = useCallback(() => {
    const rows = Array.isArray(sharesData) ? (sharesData as Record<string, string>[]) : [];
    if (rows.length === 0) return [] as Record<string, string>[];

    // Sort DESC by date (most recent first)
    const sorted = [...rows].sort((a, b) => {
      const ad = new Date(a.date || '').getTime();
      const bd = new Date(b.date || '').getTime();
      return isNaN(bd - ad) ? 0 : bd - ad;
    });

    if (period === 'quarterly') return sorted;

    // Annual: group by calendar year (assumption) and pick the most recent entry per year
    const byYear = new Map<string, Record<string, string>>();
    for (const entry of sorted) {
      const d = entry.date || '';
      const year = d.slice(0, 4);
      if (!byYear.has(year)) byYear.set(year, entry);
    }
    return Array.from(byYear.values());
  }, [sharesData, period]);

  // Utility to convert array of objects to CSV string
  function arrayToCSV(data: Record<string, string | number | null>[]): string {
  if (!data.length || !data[0]) return '';
  const cols = Object.keys(data[0] ?? {});
  const escape = (val: string | number | null) => (typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val);
  const header = cols.join(',');
  const rows = data.map(row => cols.map(col => escape(row[col] ?? '')).join(','));
  return [header, ...rows].join('\n');
  }

  // Download CSV file
  function downloadCSV(data: Record<string, string | number | null>[], filename: string) {
    const csv = arrayToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const financialCategories = [
    {
      id: "balance-sheet",
      title: "Balance Sheet",
      icon: BarChart3,
      color: "primary",
      data: periodData.map((p: Record<string, string>) => ({
        reportedCurrency: p.reportedCurrency ?? "",
        fiscalDateEnding: p.fiscalDateEnding ?? "",
        ...Object.fromEntries(BALANCE_SHEET_FIELDS.map(f => [f, p[f] ?? ""])),
      })),
    },
    {
      id: "income-statement",
      title: "Income Statement",
      icon: DollarSign,
      color: "success",
      data: periodData.map((p: Record<string, string>) => ({
        reportedCurrency: p.reportedCurrency ?? "",
        fiscalDateEnding: p.fiscalDateEnding ?? "",
        ...Object.fromEntries(INCOME_STATEMENT_FIELDS.map(f => [f, p[f] ?? ""])),
      })),
    },
    {
      id: "cash-flow",
      title: "Cash Flow",
      icon: Activity,
      color: "warning",
      data: periodData.map((p: Record<string, string>) => ({
        reportedCurrency: p.reportedCurrency ?? "",
        fiscalDateEnding: p.fiscalDateEnding ?? "",
        ...Object.fromEntries(CASH_FLOW_FIELDS.map(f => [f, p[f] ?? ""])),
      })),
    },
  ];

  /**
   * Helper to pick only certain keys.
   * Usage: pick(rawData, ["a","b"])
   */
    const _pick = <T extends object, K extends keyof T>(
      obj: T,
      keys: K[]
    ): Pick<T, K> =>
      keys.reduce((acc, k) => {
        acc[k] = obj[k];
        return acc;
      }, {} as Pick<T, K>);

  const handleCardClick = (cardId: string) => {
    setExpandedCards((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    );
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Header: Company Name, Ticker, Market Cap, Toggles */}
      <div className="flex items-center justify-between pt-2 pb-4 border-b border-border" style={{ minHeight: '64px' }}>
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-foreground mb-0">
            {ticker.name}
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-muted-foreground text-base font-medium">
              {ticker.symbol}
            </p>
            {marketCap && marketCapCurrency && (
              <p className="text-muted-foreground text-base font-medium">
                {(() => {
                  const num = Number(marketCap.replace(/,/g, ""));
                  let display = marketCap;
                  let label = marketCapCurrency;
                  if (!isNaN(num)) {
                    if (num >= 1e10) { display = (num / 1e9).toLocaleString(undefined, { maximumFractionDigits: 2 }); label = `Billion ${marketCapCurrency}`; }
                    else if (num >= 1e7) { display = (num / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 }); label = `Million ${marketCapCurrency}`; }
                    else if (num >= 1e4) { display = (num / 1e3).toLocaleString(undefined, { maximumFractionDigits: 2 }); label = `Thousand ${marketCapCurrency}`; }
                    else { display = num.toLocaleString(); label = marketCapCurrency; }
                  }
                  return `Market Cap: ${display} ${label}`;
                })()}
              </p>
            )}
          </div>
        </div>
        {/* Toggles for annual/quarterly, table/chart, and periods */}
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Data:</span>
            <button
              className={`px-3 py-1 rounded font-semibold border transition-colors duration-150 ${period === 'annual' ? 'bg-blue-100 text-blue-700 border-blue-300 shadow-sm' : 'bg-background text-foreground border-border'}`}
              onClick={() => setPeriod('annual')}
              style={{ minWidth: 80 }}
            >
              Annual
            </button>
            <button
              className={`px-3 py-1 rounded font-semibold border transition-colors duration-150 ${period === 'quarterly' ? 'bg-blue-100 text-blue-700 border-blue-300 shadow-sm' : 'bg-background text-foreground border-border'}`}
              onClick={() => setPeriod('quarterly')}
              style={{ minWidth: 80 }}
            >
              Quarterly
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">View:</span>
            <button
              className={`px-3 py-1 rounded font-semibold border transition-colors duration-150 ${view === 'table' ? 'bg-blue-100 text-blue-700 border-blue-300 shadow-sm' : 'bg-background text-foreground border-border'}`}
              onClick={() => setView('table')}
              style={{ minWidth: 80 }}
            >
              Table
            </button>
            <button
              className={`px-3 py-1 rounded font-semibold border transition-colors duration-150 ${view === 'chart' ? 'bg-blue-100 text-blue-700 border-blue-300 shadow-sm' : 'bg-background text-foreground border-border'}`}
              onClick={() => setView('chart')}
              style={{ minWidth: 80 }}
            >
              Chart
            </button>
          </div>
          {/* Periods Toggle Buttons */}
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Periods:</span>
            {periodOptions.map((p) => (
              <button
                key={p}
                className={`px-3 py-1 rounded font-semibold border transition-colors duration-150 ${selectedPeriod === p ? 'bg-blue-100 text-blue-700 border-blue-300 shadow-sm' : 'bg-background text-foreground border-border'}`}
                onClick={() => setSelectedPeriod(p)}
                style={{ minWidth: 40 }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs Bar below header */}
  <div className="flex gap-2 border-b border-border bg-card sticky top-0 z-20">
        <button
          className={`px-4 py-2 font-semibold text-xs ${activeTab === 'fundamentals' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('fundamentals')}
        >Fundamental Data</button>
        <button
          className={`px-4 py-2 font-semibold text-xs ${activeTab === 'shares' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('shares')}
        >Shares Outstanding & Market Cap</button>
        <button
          className={`px-4 py-2 font-semibold text-xs ${activeTab === 'insider' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('insider')}
        >Insider Trades Data</button>
        <button
          className={`px-4 py-2 font-semibold text-xs ${activeTab === 'dividends' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('dividends')}
        >Dividends</button>
        <button
          className={`px-4 py-2 font-semibold text-xs ${activeTab === 'latest' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('latest')}
        >Latest Developments</button>
        <button
          className={`px-4 py-2 font-semibold text-xs ${activeTab === 'sentiment' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('sentiment')}
        >Sentiment</button>
        <button
          className={`px-4 py-2 font-semibold text-xs ${activeTab === 'kpi' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('kpi')}
        >KPI</button>
        <button
          className={`px-4 py-2 font-semibold text-xs ${activeTab === 'reports' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('reports')}
        >Report Filings</button>
      </div>

      {/* AI Assistant drawer removed; handled at top-level Dashboard */}

      {/* latest developments */}
      {activeTab === 'latest' && (
        <div className="w-full">
          {newsLoading ? (
            <div className="flex justify-center items-center h-32">
              <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2"></span>
              <span>Loading latest developments...</span>
            </div>
          ) : newsError ? (
            <div className="text-center text-destructive py-8">
              <span>Error: {newsError}</span>
            </div>
          ) : Array.isArray(news) && news.length > 0 ? (
            <>
              <div className="mb-4 text-lg font-semibold text-primary text-center">
                Latest Developments for {ticker.symbol}
              </div>
              <div className="space-y-6">
                {news.map((item, idx) => (
                  <div key={idx} className="p-6 text-base text-foreground border rounded-lg bg-card shadow-sm whitespace-pre-line">
                    <div className="mb-2 text-sm text-muted-foreground text-right">
                      {item.month_end && item.year ? `${item.month_end}/${item.year}` : ''}
                    </div>
                    {item.news_output}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-muted-foreground border rounded-lg">This is a trailing monthly news feed. Permanently hold this ticker in your portfolio to receive monthly news at beginning each month.</div>
          )}
        </div>
      )}
      {activeTab === 'reports' && (
        <div className="w-full">
          <div className="p-6 border rounded-lg bg-card shadow-sm mb-8 max-w-full" style={{ maxWidth: '80vw' }}>
            <div className="flex justify-between items-center mb-2">
              <button
                className="px-3 py-1 rounded font-semibold border border-blue-300 bg-blue-100 text-blue-700 shadow-sm hover:bg-blue-200 transition-colors text-xs mr-4"
                onClick={() => {
                  let exportData = fullQuarterlyData;
                  if (stripePlan === 'Munger' || stripePlan == null) {
                    exportData = fullQuarterlyData.slice(0, 10);
                  }
                  downloadCSV(exportData, `${ticker.symbol}_quarterly.csv`);
                }}
                disabled={fullQuarterlyData.length === 0}
              >Export CSV</button>
              <h2 className="text-lg font-semibold text-primary flex-1 text-left">Quarterly Full Extract</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border rounded-lg bg-card shadow-sm text-xs">
                <thead className="bg-blue-50">
                  <tr>
                    {fullQuarterlyData.length > 0 && Object.keys(fullQuarterlyData[0] ?? {}).map((col) => (
                      <th key={col} className="px-2 py-1 text-left whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(stripePlan === 'Munger' || stripePlan == null ? fullQuarterlyData.slice(0, 10) : fullQuarterlyData).map((row: Record<string, string | number | null>, idx: number) => (
                    <tr key={idx} className="border-b last:border-b-0">
                      {Object.keys(row).map((col) => (
                        <td key={col} className="px-2 py-1 whitespace-nowrap">{row[col] ?? "-"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-6 border rounded-lg bg-card shadow-sm max-w-full" style={{ maxWidth: '80vw' }}>
            <div className="flex justify-between items-center mb-2">
              <button
                className="px-3 py-1 rounded font-semibold border border-blue-300 bg-blue-100 text-blue-700 shadow-sm hover:bg-blue-200 transition-colors text-xs mr-4"
                onClick={() => {
                  let exportData = fullAnnualData;
                  if (stripePlan === 'Munger' || stripePlan == null) {
                    exportData = fullAnnualData.slice(0, 10);
                  }
                  downloadCSV(exportData, `${ticker.symbol}_annual.csv`);
                }}
                disabled={fullAnnualData.length === 0}
              >Export CSV</button>
              <h2 className="text-lg font-semibold text-primary flex-1 text-left">Annual Full Extract</h2>
            </div>
            <div className="overflow-x-auto">
          <table className="w-full border rounded-lg bg-card shadow-sm text-xs" style={{ tableLayout: 'auto' }}>
                <thead className="bg-blue-50">
                  <tr>
                    {fullAnnualData.length > 0 && Object.keys(fullAnnualData[0] ?? {}).map((col) => (
                      <th key={col} className="px-2 py-1 text-left whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(stripePlan === 'Munger' || stripePlan == null ? fullAnnualData.slice(0, 10) : fullAnnualData).map((row: Record<string, string | number | null>, idx: number) => (
                    <tr key={idx} className="border-b last:border-b-0">
                      {Object.keys(row).map((col) => (
                        <td key={col} className="px-2 py-1 whitespace-nowrap">{row[col] ?? "-"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'dividends' && (
        <div className="w-full">
          {dividendLoading ? (
            <div className="flex justify-center items-center h-32">
              <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2"></span>
              <span>Loading dividend data...</span>
            </div>
          ) : dividendError ? (
            <div className="text-center text-destructive py-8">
              <span>Error: {dividendError}</span>
            </div>
          ) : dividendData && Array.isArray(dividendData) && dividendData.length > 0 ? (
            <>
              <div className="w-full mb-6" style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...dividendData].reverse()} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ex_dividend_date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full">
                <table className="w-full border rounded-lg bg-card shadow-sm text-xs">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-2 py-1 text-left">Ex-Date</th>
                      <th className="px-2 py-1 text-left">Declaration</th>
                      <th className="px-2 py-1 text-left">Record</th>
                      <th className="px-2 py-1 text-left">Payment</th>
                      <th className="px-2 py-1 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dividendData.map((d, idx) => (
                      <tr key={`${d.ex_dividend_date ?? 'unknown'}-${d.amount ?? '0'}-${idx}`} className="border-b last:border-b-0">
                        <td className="px-2 py-1 whitespace-nowrap font-semibold text-primary">{d.ex_dividend_date ?? '-'}</td>
                        <td className="px-2 py-1 whitespace-nowrap text-muted-foreground">{d.declaration_date ?? '-'}</td>
                        <td className="px-2 py-1 whitespace-nowrap">{d.record_date ?? '-'}</td>
                        <td className="px-2 py-1 whitespace-nowrap">{d.payment_date ?? '-'}</td>
                        <td className="px-2 py-1 whitespace-nowrap text-right">{d.amount ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-muted-foreground border rounded-lg">No dividend data found.</div>
          )}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'sentiment' && (
        <div className="w-full">
          <div className="mb-4 text-lg font-semibold text-primary text-center">
            {(() => {
              let avg = null;
              if (Array.isArray(sentimentData) && sentimentData.length > 0) {
                const scores = sentimentData.map((item: SentimentFeedItem) => typeof item.overall_sentiment_score === 'number' ? item.overall_sentiment_score : Number(item.overall_sentiment_score)).filter((v: number) => !isNaN(v));
                if (scores.length > 0) avg = scores.reduce((a, b) => a + b, 0) / scores.length;
              }
              // Dictionary for sentiment labels
              const sentimentLabels: { [key: string]: string } = {
                'very_bullish': 'Very Bullish',
                'bullish': 'Bullish',
                'neutral': 'Neutral',
                'bearish': 'Bearish',
                'very_bearish': 'Very Bearish',
              };
              // Function to get label from avg
              function getSentimentLabel(avg: number | null): string {
                if (avg === null) return '';
                if (avg >= 0.6) return sentimentLabels['very_bullish'] ?? 'Very Bullish';
                if (avg >= 0.2) return sentimentLabels['bullish'] ?? 'Bullish';
                if (avg > -0.2 && avg < 0.2) return sentimentLabels['neutral'] ?? 'Neutral';
                if (avg <= -0.6) return sentimentLabels['very_bearish'] ?? 'Very Bearish';
                if (avg < 0.2 && avg > -0.6) return sentimentLabels['bearish'] ?? 'Bearish';
                return '';
              }
              const label = getSentimentLabel(avg);
              return `News Sentiment for ${ticker.symbol}` + (avg !== null ? ` (Avg: ${avg.toFixed(3)} — ${label})` : '');
            })()}
          </div>
          {sentimentLoading ? (
            <div className="p-8 text-center text-muted-foreground border rounded-lg">Loading sentiment data...</div>
          ) : sentimentError ? (
            <div className="p-8 text-center text-destructive border rounded-lg">{sentimentError}</div>
          ) : Array.isArray(sentimentData) && sentimentData.length > 0 ? (
            <div className="w-full max-w-3xl mx-auto">
              <div className="mb-2 text-xs text-muted-foreground text-right">Sentiment Score per Article (Scatter Plot)</div>
              <div style={{ width: '100%', margin: '0 auto', height: 480 }}>
                <ResponsiveContainer width="100%" height={480}>
                  {/* Prepare data: each article as a dot, x axis = day */}
                  {/* Convert time_published to YYYY-MM-DD for x axis */}
                  {(() => {
                    const scatterData = sentimentData.map((item: SentimentFeedItem) => {
                      let day = '';
                      if (item.time_published) {
                        const match = String(item.time_published).match(/^(\d{4})(\d{2})(\d{2})/);
                        if (match) {
                          day = `${match[1]}-${match[2]}-${match[3]}`;
                        } else {
                          day = String(item.time_published);
                        }
                      }
                      return {
                        day,
                        overall_sentiment_score: typeof item.overall_sentiment_score === 'number' ? item.overall_sentiment_score : Number(item.overall_sentiment_score),
                        headline: item.title || item.headline || '',
                        source: item.source || '',
                      };
                    });
                    // Ensure oldest dates on the left (ascending by day)
                    const sortedScatterData = [...scatterData]
                      .filter(d => d.day)
                      .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());
                    // Compute first available day for each month to use as X-axis ticks
                    const monthTicks = Array.from(
                      new Map(
                        [...scatterData]
                          .filter(d => typeof d.day === 'string' && d.day.length >= 7)
                          .sort((a, b) => (a.day || '').localeCompare(b.day || ''))
                          .map(d => [String(d.day).slice(0, 7), d.day])
                      ).values()
                    );
                    return (
                      <ScatterChart margin={{ top: 30, right: 40, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="day"
                          type="category"
                          ticks={monthTicks}
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          interval={0}
                          allowDuplicatedCategory={false}
                          tickFormatter={(value: string) => (typeof value === 'string' ? value.slice(0, 7) : value)}
                        />
                        <YAxis dataKey="overall_sentiment_score" tick={{ fontSize: 12 }} domain={[-1, 1]} />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          formatter={(value: number, _name: string, _props: unknown) => [`${value.toFixed(3)}`, 'Sentiment']}
                          labelFormatter={(_label: string) => `Day: ${_label}`}
                          content={({ active, payload, _label }: { active?: boolean; payload?: Array<{ payload?: SentimentFeedItem & { day: string; overall_sentiment_score: number } }>; _label?: string }) => {
                            const d = payload?.[0]?.payload;
                            if (active && d) {
                              return (
                                <div className="p-2 text-xs bg-white border rounded shadow">
                                  <div><strong>{d.headline}</strong></div>
                                  <div>Score: {typeof d.overall_sentiment_score === 'number' ? d.overall_sentiment_score.toFixed(3) : d.overall_sentiment_score}</div>
                                  <div>Source: {d.source}</div>
                                  <div>Date: {d.day}</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Scatter name="Articles" data={sortedScatterData} fill="#2563eb" line={false} />
                      </ScatterChart>
                    );
                  })()}
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">Each dot represents an article published on a given day. Hover for details. Score: -1 (Bearish) to +1 (Bullish).</div>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground border rounded-lg">No sentiment data found.</div>
          )}
        </div>
      )}
      {activeTab === 'fundamentals' && (
        loading ? (
          <div className="flex justify-center items-center h-32">
            <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2"></span>
            <span>Loading financial data...</span>
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-8">
            <span>Error: {error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {financialCategories.map((category) => (
              <FinancialCard
                key={category.id}
                category={category}
                isExpanded={expandedCards.includes(category.id)}
                onClick={() => handleCardClick(category.id)}
                fullWidth={expandedCards.includes(category.id)}
                view={view}
                periods={selectedPeriod}
                availableKeys={
                  category.id === 'balance-sheet' ? [...BALANCE_SHEET_FIELDS] :
                  category.id === 'income-statement' ? [...INCOME_STATEMENT_FIELDS] :
                  [...CASH_FLOW_FIELDS]
                }
                selectedKeys={selectedFields[category.id]}
                onSelectedKeysChange={(keys) =>
                  setSelectedFields((prev) => ({ ...prev, [category.id]: keys }))
                }
                defaultKeys={DEFAULT_SELECTED_FIELDS[category.id]}
              />
            ))}
          </div>
        )
      )}

      {/* KPI Tab Content: Dummy KPI cards, expandable */}
      {activeTab === 'kpi' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(() => {
            // Prepare timeseries for each KPI
            const kpis = [
              {
                id: "kpi-1",
                title: "Net-profit margin",
                icon: BarChart3,
                color: "primary",
                key: "net_profit_margin",
                format: (v: number) => v !== undefined && v !== null && !isNaN(v) ? (v * 100).toFixed(2) + "%" : "-",
                scale: "percent"
              },
              {
                id: "kpi-2",
                title: "ROE",
                icon: DollarSign,
                color: "success",
                key: "roe",
                format: (v: number) => v !== undefined && v !== null && !isNaN(v) ? (v * 100).toFixed(2) + "%" : "-",
                scale: "percent"
              },
              {
                id: "kpi-3",
                title: "Asset Turnover",
                icon: Activity,
                color: "warning",
                key: "asset_turnover",
                format: (v: number) => v !== undefined && v !== null && !isNaN(v) ? v.toFixed(2) : "-",
                scale: "plain"
              },
              {
                id: "kpi-4",
                title: "Debt Ratio",
                icon: ScrollText,
                color: "secondary",
                key: "debt_ratio",
                format: (v: number) => v !== undefined && v !== null && !isNaN(v) ? v.toFixed(2) : "-",
                scale: "plain"
              },
              {
                id: "kpi-5",
                title: "Operating Cash Flow Margin",
                icon: DollarSign,
                color: "primary",
                key: "operating_cash_flow_margin",
                format: (v: number) => v !== undefined && v !== null && !isNaN(v) ? (v * 100).toFixed(2) + "%" : "-",
                scale: "percent"
              },
              {
                id: "kpi-6",
                title: "Free Cash Flow",
                icon: Activity,
                color: "success",
                key: "free_cash_flow",
                format: undefined, // will be set dynamically
                scale: "currency"
              },
            ];
            return kpis.map((kpi) => {
              // Prepare chart data
              const chartData = periodData
                .filter((p: Record<string, string | number | null>) => p[kpi.key] !== undefined && p[kpi.key] !== null && !isNaN(Number(p[kpi.key])))
                .map((p: Record<string, string | number | null>) => ({
                  fiscalDateEnding: typeof p.fiscalDateEnding === 'string' ? p.fiscalDateEnding : '',
                  value: Number(p[kpi.key])
                }))
                .sort((a: { fiscalDateEnding: string }, b: { fiscalDateEnding: string }) => (a.fiscalDateEnding || '').localeCompare(b.fiscalDateEnding || ''));

              // Determine scaling for currency KPIs
              let yAxisFormatter = (v: number) => v.toLocaleString();
              let tooltipFormatter = (v: number) => v.toLocaleString();
              let yAxisLabel = '';
              if (kpi.scale === "currency" && chartData.length > 0) {
                const maxAbs = Math.max(...chartData.map((d: { value: number }) => Math.abs(d.value)));
                if (maxAbs >= 1e9) {
                  yAxisFormatter = (v: number) => (v / 1e9).toFixed(2);
                  tooltipFormatter = (v: number) => `$${(v/1e9).toFixed(2)}B`;
                  yAxisLabel = 'Billions ($)';
                } else if (maxAbs >= 1e6) {
                  yAxisFormatter = (v: number) => (v / 1e6).toFixed(2);
                  tooltipFormatter = (v: number) => `$${(v/1e6).toFixed(2)}M`;
                  yAxisLabel = 'Millions ($)';
                } else if (maxAbs >= 1e3) {
                  yAxisFormatter = (v: number) => (v / 1e3).toFixed(2);
                  tooltipFormatter = (v: number) => `$${(v/1e3).toFixed(2)}K`;
                  yAxisLabel = 'Thousands ($)';
                } else {
                  yAxisFormatter = (v: number) => v.toLocaleString();
                  tooltipFormatter = (v: number) => `$${v.toLocaleString()}`;
                  yAxisLabel = '($)';
                }
              } else if (kpi.scale === "percent") {
                yAxisFormatter = (v: number) => (v * 100).toFixed(2) + "%";
                tooltipFormatter = (v: number) => v !== undefined && v !== null && !isNaN(v) ? (v * 100).toFixed(2) + "%" : "-";
                yAxisLabel = '%';
              } else {
                yAxisFormatter = (v: number) => v.toLocaleString();
                tooltipFormatter = kpi.format ? kpi.format : ((v: number) => v.toLocaleString());
                yAxisLabel = '';
              }

              // Expansion logic for KPI cards
              const isExpanded = expandedCards.includes(kpi.id);

              return (
                <div key={kpi.id} className={`bg-card border rounded-lg p-4 shadow-sm${isExpanded ? ' col-span-2' : ''}`} onClick={() => handleCardClick(kpi.id)} style={{ cursor: 'pointer' }}>
                  <div className="flex items-center mb-2">
                    {kpi.icon && <kpi.icon className="mr-2 text-xl text-primary" />}
                    <span className="font-semibold text-lg">{kpi.title}</span>
                  </div>
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="fiscalDateEnding" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(value: number) => yAxisFormatter(value)} label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle', fontSize: 12 } } : undefined} />
                        <Tooltip formatter={(value: number) => tooltipFormatter(value)} />
                        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={true} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}
      {activeTab === 'shares' && (
        sharesLoading ? (
          <div className="flex justify-center items-center h-32">
            <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2"></span>
            <span>Loading shares outstanding data...</span>
          </div>
        ) : sharesError ? (
          <div className="text-center text-destructive py-8">
            <span>Error: {sharesError}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shares Outstanding Card (basic/diluted) */}
            <FinancialCard
              key="shares-outstanding"
              category={{
                id: "shares-outstanding",
                title: "Shares Outstanding",
                icon: ScrollText,
                color: "secondary",
                data: getFilteredSharesData().map((entry: Record<string, string>) => ({
                  date: entry.date || "",
                  shares_outstanding_basic: entry.shares_outstanding_basic || "",
                  shares_outstanding_diluted: entry.shares_outstanding_diluted || "",
                })),
              }}
              isExpanded={expandedCards.includes("shares-outstanding")}
              onClick={() => handleCardClick("shares-outstanding")}
              fullWidth={expandedCards.includes("shares-outstanding")}
              view={view}
              periods={selectedPeriod}
            />

            {/* Market Cap Card (computed) */}
            <FinancialCard
              key="market-cap"
              category={{
                id: "market-cap",
                title: "Market Capitalization",
                icon: DollarSign,
                color: "primary",
                labels: {
                  market_cap_undiluted: "Market Cap (undiluted)",
                  market_cap_diluted: "Market Cap (diluted)",
                },
                data: getFilteredSharesData().map((entry: Record<string, string>) => ({
                  date: entry.date || "",
                  fiscalDateEnding: entry.date || "", // for label rendering in FinancialCard
                  market_cap_undiluted: entry.market_cap_undiluted || "",
                  market_cap_diluted: entry.market_cap_diluted || "",
                })),
              }}
              isExpanded={expandedCards.includes("market-cap")}
              onClick={() => handleCardClick("market-cap")}
              fullWidth={expandedCards.includes("market-cap")}
              view={view}
              periods={selectedPeriod}
            />
          </div>
        )
      )}
      {activeTab === 'insider' && (
        <div className="w-full">
          {insiderLoading ? (
            <div className="flex justify-center items-center h-32">
              <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2"></span>
              <span>Loading insider trades...</span>
            </div>
          ) : insiderError ? (
            <div className="text-center text-destructive py-8">
              <span>Error: {insiderError}</span>
            </div>
          ) : insiderData && Array.isArray(insiderData) && insiderData.length > 0 ? (
            <div className="w-full">
              <table className="w-full border rounded-lg bg-card shadow-sm text-xs">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-2 py-1 text-left">Date</th>
                    <th className="px-2 py-1 text-left">Ticker</th>
                    <th className="px-2 py-1 text-left">Executive</th>
                    <th className="px-2 py-1 text-left">Title</th>
                    <th className="px-2 py-1 text-left">Type</th>
                    <th className="px-2 py-1 text-left">Action</th>
                    <th className="px-2 py-1 text-right">Shares</th>
                    <th className="px-2 py-1 text-right">Price</th>
                    <th className="px-2 py-1 text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {insiderData.map((trade, idx) => {
                    const t = trade as Record<string, string | number | null>;
                    return (
                      <tr key={String(t.transaction_date) + String(t.executive) + String(t.security_type) + idx} className="border-b last:border-b-0">
                        <td className="px-2 py-1 whitespace-nowrap font-semibold text-primary">{t.transaction_date ?? '-'}</td>
                        <td className="px-2 py-1 whitespace-nowrap text-muted-foreground">{t.ticker ?? '-'}</td>
                        <td className="px-2 py-1 whitespace-nowrap">{t.executive ?? '-'}</td>
                        <td className="px-2 py-1 whitespace-nowrap text-muted-foreground">{t.executive_title ?? '-'}</td>
                        <td className="px-2 py-1 whitespace-nowrap">{t.security_type ?? '-'}</td>
                        <td className="px-2 py-1 whitespace-nowrap">{t.acquisition_or_disposal === 'A' ? 'Acquisition' : t.acquisition_or_disposal === 'D' ? 'Disposal' : '-'}</td>
                        <td className="px-2 py-1 whitespace-nowrap text-right">{t.shares ?? '-'}</td>
                        <td className="px-2 py-1 whitespace-nowrap text-right">{t.share_price ?? '-'}</td>
                        <td className="px-2 py-1 whitespace-nowrap text-right">{t.total_value !== undefined && t.total_value !== null ? Number(t.total_value).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground border rounded-lg">No insider trades found.</div>
          )}
        </div>
      )}
    </div>
  );
}