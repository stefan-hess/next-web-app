"use client";
import { useState, useEffect, useCallback } from "react";
import { useSharesOutstandingData } from "app/lib/useSharesOutstandingData";
import { useInsiderTradesData } from "app/lib/useInsiderTradesData";
import { useCachedFinancialData } from "app/lib/useCachedFinancialData";
import { useDividendData } from "app/lib/useDividendData";
import { useLatestNews } from "app/lib/useLatestNews";
import { DollarSign, BarChart3, ScrollText, Activity } from "lucide-react";
import { FinancialCard } from "./FinancialCard";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { Ticker } from "./Dashboard";
import { supabase } from 'app/lib/supabaseClient';



interface MainDashboardProps {
  ticker: Ticker;
  marketCap?: string;
  marketCapCurrency?: string;
  commentariesSidebarOpen?: boolean;
  setCommentariesSidebarOpen?: (open: boolean) => void;
}

export const MainDashboard = ({ ticker, marketCap, marketCapCurrency, commentariesSidebarOpen, setCommentariesSidebarOpen }: MainDashboardProps) => {
  // Sidebar state for replying to a main post
  const [replySidebarOpen, setReplySidebarOpen] = useState(false);
  const [selectedMainPost, setSelectedMainPost] = useState<any | null>(null);
  // Commentary draft state
  const [commentTitle, setCommentTitle] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [commentSuccess, setCommentSuccess] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [mainComments, setMainComments] = useState<any[]>([]);
  const { data: insiderData, loading: insiderLoading, error: insiderError } = useInsiderTradesData(ticker.symbol);
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [period, setPeriod] = useState<'annual' | 'quarterly'>('annual');
  const [view, setView] = useState<'table' | 'chart'>('table');
  const [activeTab, setActiveTab] = useState<'fundamentals' | 'shares' | 'insider' | 'dividends' | 'latest' | 'kpi' | 'reports' | 'commentaries'>('fundamentals');
  const [userAlias, setUserAlias] = useState<string | null>(null);
  const [showAliasPrompt, setShowAliasPrompt] = useState(false);
  const [aliasInput, setAliasInput] = useState('');
  const [aliasError, setAliasError] = useState('');
  const [checkingAlias, setCheckingAlias] = useState(false);
  const { news, loading: newsLoading, error: newsError } = useLatestNews(ticker.symbol);
  const { data: dividendData, loading: dividendLoading, error: dividendError } = useDividendData(ticker.symbol);
  const { data, loading, error } = useCachedFinancialData(ticker.symbol);
  const periodData = data?.[ticker.symbol]?.[period] || []; 
  // Full extracts for reports tab
  const fullQuarterlyData = data?.[ticker.symbol]?.quarterly || [];
  const fullAnnualData = data?.[ticker.symbol]?.annual || [];
  const { data: sharesData, loading: sharesLoading, error: sharesError } = useSharesOutstandingData(ticker.symbol);

  const fetchMainComments = useCallback(async () => {
    console.debug('[Commentaries] fetchMainComments:start', { ticker: ticker.symbol });
    setLoadingComments(true);

    const bypassCache = (process.env.NEXT_PUBLIC_BYPASS_COMMENTS_CACHE === 'true') || (() => {
      try {
        return typeof window !== 'undefined' && localStorage.getItem('bypass_comments_cache') === 'true';
      } catch {
        return false;
      }
    })();
    console.debug('[Commentaries] bypassCache?', bypassCache);

    // 5-minute cache per ticker in localStorage
    if (!bypassCache) {
      try {
        const cacheKey = `comments_${ticker.symbol}`;
        const cachedRaw = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
        console.debug('[Commentaries] cache lookup', { cacheKey, found: !!cachedRaw });
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw) as { ts: number; data: any[] };
            const isFresh = Date.now() - (cached.ts || 0) < 5 * 60 * 1000;
            console.debug('[Commentaries] cache parsed', { ts: cached.ts, isFresh, size: Array.isArray(cached.data) ? cached.data.length : -1 });
            if (isFresh && Array.isArray(cached.data)) {
              console.debug('[Commentaries] serving from cache');
              setMainComments(cached.data);
              setLoadingComments(false);
              return; // serve from cache
            }
          } catch {
            // ignore parse errors and fetch fresh
            console.debug('[Commentaries] cache parse failed, fetching fresh');
          }
        }
      } catch {
        // localStorage not available (SSR or blocked), continue to fetch
        console.debug('[Commentaries] cache unavailable, fetching fresh');
      }
    }

    const { data, error } = await supabase
      .from('ticker_commentaries')
      .select('*')
      .eq('related_ticker', ticker.symbol)
      .eq('original_post', true)
      .order('created_at', { ascending: false });
    if (error) {
      console.debug('[Commentaries] supabase error', error);
      setMainComments([]);
      setLoadingComments(false);
      return;
    }
    const rows = data ?? [];
    console.debug('[Commentaries] supabase rows', { count: rows.length });
    setMainComments(rows);
    setLoadingComments(false);

    // write to cache (unless bypassing)
    if (!bypassCache) {
      try {
        const cacheKey = `comments_${ticker.symbol}`;
        localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: rows }));
        console.debug('[Commentaries] cache written', { cacheKey, count: rows.length });
      } catch {
        // ignore quota or availability issues
        console.debug('[Commentaries] cache write failed');
      }
    }
  }, [ticker.symbol]);

  // Fetch when tab changes or sidebar opens
  useEffect(() => {
    if (replySidebarOpen || activeTab === 'commentaries') {
      console.debug('[Commentaries] effect trigger: replySidebarOpen/tab', { replySidebarOpen, activeTab });
      fetchMainComments();
    }
  }, [replySidebarOpen, activeTab, fetchMainComments]);

  // When the sidebar opens from the header icon, fetch comments without changing tabs
  useEffect(() => {
    if (replySidebarOpen) {
      console.debug('[Commentaries] sidebar opened via header or local control');
      fetchMainComments();
    }
  }, [replySidebarOpen, fetchMainComments]);

  // Sync sidebar open state with parent prop and trigger fetch when opening
  useEffect(() => {
    if (typeof commentariesSidebarOpen === 'boolean') {
      console.debug('[Commentaries] prop change: commentariesSidebarOpen', commentariesSidebarOpen);
      setReplySidebarOpen(commentariesSidebarOpen);
      if (commentariesSidebarOpen) {
        console.debug('[Commentaries] prop opened -> fetching');
        fetchMainComments();
      }
    }
  }, [commentariesSidebarOpen, fetchMainComments]);

  // When sidebar closes locally, notify parent
  const handleCloseSidebar = () => {
    setReplySidebarOpen(false);
    if (setCommentariesSidebarOpen) setCommentariesSidebarOpen(false);
  };

  // Utility to convert array of objects to CSV string
  function arrayToCSV(data: Record<string, any>[]): string {
  if (!data.length || !data[0]) return '';
  const cols = Object.keys(data[0] as Record<string, any>);
  const escape = (val: any) => (typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val);
  const header = cols.join(',');
  const rows = data.map(row => cols.map(col => escape(row[col] ?? '')).join(','));
  return [header, ...rows].join('\n');
  }

  // Download CSV file
  function downloadCSV(data: Record<string, any>[], filename: string) {
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

  // Use periodData for your cards
  const financialCategories = [
    {
      id: "balance-sheet",
      title: "Balance Sheet",
      icon: BarChart3,
      color: "primary",
      data: periodData.map((p: Record<string, string>) => ({
        reportedCurrency: p.reportedCurrency ?? "",
        fiscalDateEnding: p.fiscalDateEnding ?? "",
        totalAssets: p.totalAssets ?? "",
        totalLiabilities: p.totalLiabilities ?? "",
        shareholderEquity: p.totalShareholderEquity ?? "",
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
        totalRevenue: p.totalRevenue ?? "",
        costOfRevenue: p.costOfRevenue ?? "",
        ebitda: p.ebitda ?? "",
        netIncome: p.netIncome ?? "",
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
        operatingCashflow: p.operatingCashflow ?? "",
        cashflowFromInvestment: p.cashflowFromInvestment ?? "",
        cashflowFromFinancing: p.cashflowFromFinancing ?? "",
      })),
    },
  ];

  /**
   * Helper to pick only certain keys.
   * Usage: pick(rawData, ["a","b"])
   */
  const pick = <T extends object, K extends keyof T>(
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
        {/* Toggles for annual/quarterly and table/chart */}
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
        </div>
      </div>

      {/* Tabs Bar below header */}
      <div className="flex gap-2 border-b border-border bg-card sticky top-0 z-20">
        <button
          className={`px-4 py-2 font-semibold ${activeTab === 'fundamentals' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('fundamentals')}
        >Fundamental Data</button>
        <button
          className={`px-4 py-2 font-semibold ${activeTab === 'shares' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('shares')}
        >Shares Outstanding</button>
        <button
          className={`px-4 py-2 font-semibold ${activeTab === 'insider' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('insider')}
        >Insider Trades Data</button>
        <button
          className={`px-4 py-2 font-semibold ${activeTab === 'dividends' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('dividends')}
        >Dividends</button>
        <button
          className={`px-4 py-2 font-semibold ${activeTab === 'latest' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('latest')}
        >Latest Developments</button>
        <button
          className={`px-4 py-2 font-semibold ${activeTab === 'kpi' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('kpi')}
        >KPI</button>
        <button
          className={`px-4 py-2 font-semibold ${activeTab === 'reports' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('reports')}
        >Report Filings</button>
<button
  className={`px-4 py-2 font-semibold ${activeTab === 'commentaries' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
  onClick={async () => {
    if (!userAlias) {
      setCheckingAlias(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('news_subscribed_clients')
          .select('user_alias')
          .eq('client_id', user.id)
          .single();
        if (data && data.user_alias) {
          setUserAlias(data.user_alias);
          setActiveTab('commentaries');
        } else {
          setShowAliasPrompt(true);
        }
      } else {
        setAliasError('You must be logged in to comment.');
      }
      setCheckingAlias(false);
    } else {
      setActiveTab('commentaries');
    }
  }}
>
  Commentaries
</button>
      </div>

      {/* Global Discussions Sidebar Overlay (always available) */}
      {replySidebarOpen && (
        <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-border" style={{ transition: 'transform 0.3s', transform: replySidebarOpen ? 'translateX(0)' : 'translateX(100%)' }}>
          <div className="flex justify-between items-center p-4 border-b">
            <div className="font-bold text-lg text-primary">{selectedMainPost === 'NEW_POST' ? 'Create New Post' : 'Comment Thread'}</div>
            <button className="text-muted-foreground px-2 py-1 rounded hover:bg-blue-100" onClick={handleCloseSidebar}>Close</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {loadingComments ? (
              <div className="flex justify-center items-center h-32">
                <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2"></span>
                <span>Loading discussions…</span>
              </div>
            ) : selectedMainPost === 'NEW_POST' ? (
              <div className="mb-4 border-b pb-4">
                <div className="flex gap-3 items-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                    <span className="font-bold text-blue-700 text-lg">{userAlias ? userAlias.charAt(0).toUpperCase() : 'U'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-primary text-lg">Draft Commentary</span>
                    <span className="block text-xs text-muted-foreground">by {userAlias ?? 'User'} • just now</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">What's your take on {ticker.symbol}?</h3>
                <p className="text-base text-foreground mb-4">Share your thoughts, analysis, or questions about this company. Start the conversation below!</p>
                <input
                  type="text"
                  className="w-full p-2 border rounded mb-2 bg-background text-foreground"
                  placeholder="Title of your post"
                  value={commentTitle}
                  onChange={e => setCommentTitle(e.target.value)}
                  disabled={!userAlias}
                />
                <textarea
                  className="w-full p-2 border rounded bg-background text-foreground resize-y mb-2"
                  rows={5}
                  placeholder={userAlias ? "Write your commentary..." : "Set your alias to comment"}
                  value={commentContent}
                  onChange={e => setCommentContent(e.target.value)}
                  disabled={!userAlias}
                />
                <button
                  className={`px-4 py-2 rounded font-semibold border border-blue-300 bg-blue-100 text-blue-700 shadow-sm ${!userAlias || !commentTitle.trim() || !commentContent.trim() ? 'cursor-not-allowed' : ''}`}
                  disabled={!userAlias || !commentTitle.trim() || !commentContent.trim() || postingComment}
                  onClick={async () => {
                    if (!userAlias || !commentTitle.trim() || !commentContent.trim()) return;
                    setPostingComment(true);
                    setCommentError('');
                    const { error: insertError } = await supabase
                      .from('ticker_commentaries')
                      .insert([
                        {
                          related_ticker: ticker.symbol,
                          original_post: true,
                          post_content: commentContent,
                          created_by: userAlias,
                          post_title: commentTitle
                        }
                      ]);
                    if (insertError) {
                      setCommentError(`Failed to post comment. ${insertError.message || ''}`);
                      setPostingComment(false);
                      return;
                    }
                    setCommentTitle('');
                    setCommentContent('');
                    setPostingComment(false);
                    setCommentSuccess('Comment posted!');
                    // Invalidate cache first
                    try {
                      const cacheKey = `comments_${ticker.symbol}`;
                      localStorage.removeItem(cacheKey);
                      console.debug('[Commentaries] cache invalidated after post', { cacheKey });
                    } catch {}
                    // Immediately refetch latest comments and refresh cache
                    try { 
                      console.debug('[Commentaries] refetching after post');
                      await fetchMainComments(); 
                    } catch {}
                    setTimeout(() => setCommentSuccess(''), 2000);
                  }}
                >Post Commentary</button>
                {!userAlias && <p className="text-xs text-muted-foreground mt-2">Set your alias to enable commenting.</p>}
                {commentError && <p className="text-xs text-destructive mt-2">{commentError}</p>}
                {commentSuccess && <p className="text-xs text-success mt-2">{commentSuccess}</p>}
              </div>
            ) : selectedMainPost ? (
              <div className="mb-4">
                <div className="flex gap-3 items-center mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center">
                    <span className="font-bold text-blue-700 text-lg">{selectedMainPost.created_by ? selectedMainPost.created_by.charAt(0).toUpperCase() : 'U'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-primary text-lg">{selectedMainPost.post_title}</span>
                    <span className="block text-xs text-muted-foreground">by {selectedMainPost.created_by ?? 'User'} • {new Date(selectedMainPost.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="whitespace-pre-line text-base text-foreground">{selectedMainPost.post_content}</div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center border rounded-lg bg-card shadow-sm p-6">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl mb-3">
                  +
                </div>
                <h3 className="text-lg font-semibold mb-1">Be the first to start a discussion</h3>
                <p className="text-sm text-muted-foreground mb-4">No commentaries for {ticker.symbol} yet. Share your insights to kick things off.</p>
                <button
                  className="px-4 py-2 rounded font-semibold border border-blue-300 bg-blue-100 text-blue-700 shadow-sm hover:bg-blue-200 transition-colors"
                  onClick={() => setSelectedMainPost('NEW_POST')}
                >Create New Post</button>
              </div>
            )}
          </div>
        </div>
      )}

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
          ) : news ? (
            <>
              {/* Month end and year title */}
              <div className="mb-2 text-lg font-semibold text-primary text-center">
                Latest Developments for {ticker.symbol} - {(() => {
                  const now = new Date();
                  let month = now.getMonth(); // previous month (0-based)
                  let year = now.getFullYear();
                  if (month === 0) { month = 12; year -= 1; }
                  // Format month name
                  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
                  return `${monthName} ${year}`;
                })()}
              </div>
              <div className="p-6 text-base text-foreground border rounded-lg bg-card shadow-sm whitespace-pre-line">
                {news}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-muted-foreground border rounded-lg">No recent developments found for this ticker.</div>
          )}
        </div>
      )}
      {activeTab === 'reports' && (
        <div className="w-full">
          <div className="p-6 border rounded-lg bg-card shadow-sm mb-8 max-w-full" style={{ maxWidth: '80vw' }}>
            <div className="flex justify-between items-center mb-2">
              <button
                className="px-3 py-1 rounded font-semibold border border-blue-300 bg-blue-100 text-blue-700 shadow-sm hover:bg-blue-200 transition-colors text-xs mr-4"
                onClick={() => downloadCSV(fullQuarterlyData, `${ticker.symbol}_quarterly.csv`)}
                disabled={fullQuarterlyData.length === 0}
              >Export CSV</button>
              <h2 className="text-lg font-semibold text-primary flex-1 text-left">Quarterly Full Extract</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border rounded-lg bg-card shadow-sm text-xs">
                <thead className="bg-blue-50">
                  <tr>
                    {fullQuarterlyData.length > 0 && Object.keys(fullQuarterlyData[0]).map((col) => (
                      <th key={col} className="px-2 py-1 text-left whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fullQuarterlyData.map((row: Record<string, any>, idx: number) => (
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
                onClick={() => downloadCSV(fullAnnualData, `${ticker.symbol}_annual.csv`)}
                disabled={fullAnnualData.length === 0}
              >Export CSV</button>
              <h2 className="text-lg font-semibold text-primary flex-1 text-left">Annual Full Extract</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border rounded-lg bg-card shadow-sm text-xs">
                <thead className="bg-blue-50">
                  <tr>
                    {fullAnnualData.length > 0 && Object.keys(fullAnnualData[0]).map((col) => (
                      <th key={col} className="px-2 py-1 text-left whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fullAnnualData.map((row: Record<string, any>, idx: number) => (
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
{activeTab === 'commentaries' && (
  <div className="w-full flex flex-col items-center py-8">
    <button
      className="mb-6 px-4 py-2 rounded font-semibold border border-blue-300 bg-blue-100 text-blue-700 shadow-sm hover:bg-blue-200 transition-colors"
      onClick={() => {
        setSelectedMainPost('NEW_POST');
        setReplySidebarOpen(true);
      }}
    >Add New Post</button>

    {/* Comments list */}
    <div className="w-full max-w-3xl">
      {loadingComments ? (
        <div className="flex justify-center items-center h-24 text-muted-foreground">
          Loading commentaries…
        </div>
      ) : mainComments && mainComments.length > 0 ? (
        <ul className="space-y-3">
          {mainComments.map((post: any) => (
            <li key={post.id}>
              <button
                className="w-full text-left p-4 border rounded-lg bg-card hover:bg-muted/40 transition-colors shadow-sm"
                onClick={() => {
                  setSelectedMainPost(post);
                  setReplySidebarOpen(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-primary truncate pr-2">{post.post_title || 'Untitled'}</div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {post.created_by || 'User'} • {post.created_at ? new Date(post.created_at).toLocaleString() : ''}
                  </div>
                </div>
                {post.post_content && (
                  <div className="mt-1 text-sm text-foreground line-clamp-2">
                    {post.post_content}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center text-center border rounded-lg bg-card shadow-sm p-6">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl mb-3">
            +
          </div>
          <h3 className="text-lg font-semibold mb-1">Be the first to start a discussion</h3>
          <p className="text-sm text-muted-foreground mb-4">No commentaries for {ticker.symbol} yet. Share your insights to kick things off.</p>
          <button
            className="px-4 py-2 rounded font-semibold border border-blue-300 bg-blue-100 text-blue-700 shadow-sm hover:bg-blue-200 transition-colors"
            onClick={() => {
              setSelectedMainPost('NEW_POST');
              setReplySidebarOpen(true);
            }}
          >Create New Post</button>
        </div>
      )}
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
                .filter((p: Record<string, any>) => p[kpi.key] !== undefined && p[kpi.key] !== null && !isNaN(Number(p[kpi.key])))
                .map((p: Record<string, any>) => ({
                  fiscalDateEnding: p.fiscalDateEnding,
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
            <FinancialCard
              key="shares-outstanding"
              category={{
                id: "shares-outstanding",
                title: "Shares Outstanding",
                icon: ScrollText,
                color: "secondary",
                  data: Array.isArray(sharesData) ? (sharesData as Record<string, string>[]).map(entry => ({
                      ...entry,
                      date: entry.date || ""
                    })) : [],
              }}
              isExpanded={expandedCards.includes("shares-outstanding")}
              onClick={() => handleCardClick("shares-outstanding")}
              fullWidth={expandedCards.includes("shares-outstanding")}
              view={view}
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
                    const t = trade as Record<string, any>;
                    return (
                      <tr key={t.transaction_date + t.executive + t.security_type + idx} className="border-b last:border-b-0">
                        <td className="px-2 py-1 whitespace-nowrap font-semibold text-primary">{t.transaction_date}</td>
                        <td className="px-2 py-1 whitespace-nowrap text-muted-foreground">{t.ticker}</td>
                        <td className="px-2 py-1 whitespace-nowrap">{t.executive}</td>
                        <td className="px-2 py-1 whitespace-nowrap text-muted-foreground">{t.executive_title}</td>
                        <td className="px-2 py-1 whitespace-nowrap">{t.security_type}</td>
                        <td className="px-2 py-1 whitespace-nowrap">{t.acquisition_or_disposal === 'A' ? 'Acquisition' : 'Disposal'}</td>
                        <td className="px-2 py-1 whitespace-nowrap text-right">{t.shares}</td>
                        <td className="px-2 py-1 whitespace-nowrap text-right">{t.share_price}</td>
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
    {/* Alias Prompt Modal */}
    {showAliasPrompt && (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-sm" style={{ backgroundColor: '#fff' }}>
          <h2 className="text-lg font-bold mb-2">Choose your alias</h2>
          <p className="text-sm text-muted-foreground mb-4">Enter a unique alias to use for commenting. This will be visible to others.</p>
          <input
            type="text"
            className="w-full p-2 border rounded mb-2"
            value={aliasInput}
            onChange={e => { setAliasInput(e.target.value); setAliasError(''); }}
            placeholder="Your alias"
            disabled={checkingAlias}
          />
          {aliasError && <p className="text-xs text-destructive mb-2">{aliasError}</p>}
          <div className="flex gap-2 justify-end">
            <button
              className="px-4 py-2 rounded font-semibold border border-border bg-background text-foreground"
              onClick={() => { setShowAliasPrompt(false); setAliasInput(''); setAliasError(''); }}
              disabled={checkingAlias}
            >Cancel</button>
            <button
              className="px-4 py-2 rounded font-semibold border border-blue-300 bg-blue-100 text-blue-700"
              disabled={checkingAlias || !aliasInput.trim()}
              onClick={async () => {
                setCheckingAlias(true);
                setAliasError('');
                const { data: existing, error: aliasCheckError } = await supabase
                  .from('news_subscribed_clients')
                  .select('user_alias')
                  .eq('user_alias', aliasInput.trim())
                  .single();
                if (existing) {
                  setAliasError('Alias already taken. Please choose another.');
                  setCheckingAlias(false);
                  return;
                }
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                  setAliasError('You must be logged in.');
                  setCheckingAlias(false);
                  return;
                }
                const { error: updateError } = await supabase
                  .from('news_subscribed_clients')
                  .update({ user_alias: aliasInput.trim() })
                  .eq('client_id', user.id);
                if (updateError) {
                  setAliasError(`Failed to set alias. ${updateError.message || 'Try again.'}`);
                  setCheckingAlias(false);
                  return;
                }
                setUserAlias(aliasInput.trim());
                setShowAliasPrompt(false);
                setAliasInput('');
                setAliasError('');
                setActiveTab('commentaries');
                setCheckingAlias(false);
              }}
            >Set Alias</button>
          </div>
        </div>
      </div>
    )}
  </div>
);
};