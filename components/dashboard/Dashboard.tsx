"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { supabase } from "app/lib/supabaseClient";
import { DashboardHeader } from "components/dashboard/DashboardHeader";
import { GetStarted } from "components/dashboard/GetStarted";
import { MainDashboard } from "components/dashboard/MainDashboard";
import { SidebarProvider } from "components/ui/sidebar";
import { GLOBAL_VARS } from "globalVars";
import ChatAssistant from "./Chatbot";
import { DashboardSidebar } from "./DashboardSidebar";
interface ClientData {
  annual?: unknown[];
  quarterly?: unknown[];
  shares?: unknown[];
  news?: unknown[];
  insider?: unknown[];
  dividends?: unknown[];
}
export interface Ticker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export const Dashboard = () => {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [selectedTickers, setSelectedTickers] = useState<Ticker[]>([]);
  const [activeTicker, setActiveTicker] = useState("");
  // Memoized setter to avoid update loop
  const handleSelectTicker = useCallback((symbol: string) => {
    setActiveTicker(symbol);
  }, []);
  const [marketCap, setMarketCap] = useState<string>("");
  const [marketCapCurrency, setMarketCapCurrency] = useState<string>("");
  const [commentariesSidebarOpen, setCommentariesSidebarOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantClientData, setAssistantClientData] = useState<ClientData | null>(null);
  const [hasBuffettTier, setHasBuffettTier] = useState(false);

  // Helper for scaling market cap
  function _autoScale(_values: string[], _currency: string) {
    // ...existing code...
  }

  // Fetch logged-in user's email once
  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Failed to fetch user:", error);
        if (error.message.includes("Refresh Token Not Found") || error.message.includes("Invalid Refresh Token")) {
          await supabase.auth.signOut();
          router.push("/login");
        }
        return;
      }
      setUserEmail(data.user?.email || "");
    };
    fetchUserEmail();
  }, [router]);

  // Check Buffett tier only when userEmail changes (i.e., new session)
  useEffect(() => {
    if (!userEmail) return;
    const checkBuffettTier = async () => {
      const { data: tierData, error: tierError } = await supabase
        .from("news_subscribed_clients")
        .select("stripe_plan")
        .eq("email", userEmail)
        .single();
      if (tierError) {
        console.error("Error fetching user tier:", tierError);
      }
      setHasBuffettTier(
        tierData?.stripe_plan === GLOBAL_VARS.PLAN_BUFFETT ||
        tierData?.stripe_plan === GLOBAL_VARS.PLAN_MUNGER
      );
    };
    checkBuffettTier();
  }, [userEmail]);

  // Fetch market cap and currency for active ticker
  useEffect(() => {
    if (!activeTicker) return;
    // Check localStorage cache first
    const cacheKey = `marketcap_${activeTicker}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const obj = JSON.parse(cached);
        setMarketCap((obj as { marketCap?: string }).marketCap || "");
        setMarketCapCurrency((obj as { currency?: string }).currency || "");
        return;
      } catch {}
    }
    // Fetch from local API route
    const fetchMarketCap = async () => {
      try {
        const res = await fetch(`/api/marketcap?symbol=${activeTicker}`);
        const data = await res.json();
        const cap = (data as { marketCap?: string }).marketCap || "";
        const currency = (data as { currency?: string }).currency || "";
        setMarketCap(cap);
        setMarketCapCurrency(currency);
        localStorage.setItem(cacheKey, JSON.stringify({ marketCap: cap, currency }));
      } catch {
        setMarketCap("");
        setMarketCapCurrency("");
      }
    };
    fetchMarketCap();
  }, [activeTicker]);

  // Fetch allowed tickers for this user
  useEffect(() => {
    if (!userEmail) return;

    const fetchAllowedTickers = async () => {
      const { data, error } = await supabase
        .from("ticker_selection_clients")
        .select("ticker, name")
        .eq("email", userEmail);

      if (error) {
        console.error("Error fetching tickers:", error);
        return;
      }

      const tickers: Ticker[] =
        (data ?? []).filter(Boolean).map((row: { ticker: string; name: string }) => ({
          symbol: row.ticker,
          name: row.name,
          price: 0,
          change: 0,
          changePercent: 0,
        }));

      setSelectedTickers(tickers);
    };

    fetchAllowedTickers();
  }, [userEmail]);

  // Ensure active ticker is set when we first receive tickers
  useEffect(() => {
    if (!activeTicker && selectedTickers.length > 0) {
      setActiveTicker(selectedTickers[0]?.symbol || "");
    }
  }, [selectedTickers, activeTicker]);

  const addTicker = (ticker: Ticker) => {
    setSelectedTickers((prev) => {
      if (prev.find((t) => t.symbol === ticker.symbol)) return prev;
      const next = [...prev, ticker];
      if (!activeTicker) setActiveTicker(ticker.symbol);
      return next;
    });
  };

  const removeTicker = (symbol: string) => {
    setSelectedTickers((prev) => {
      const next = prev.filter((t) => t.symbol !== symbol);
      if (activeTicker === symbol) {
        setActiveTicker(next[0]?.symbol || "");
      }
      return next;
    });
  };

  const currentTicker = selectedTickers.find(
    (t) => t.symbol === activeTicker
  );

  // Handler to open commentaries sidebar
  const handleOpenCommentariesSidebar = () => {
    setCommentariesSidebarOpen(true);
  } 

  // Handler to toggle assistant chatbox
  const handleOpenAssistant = () => {
    setAssistantOpen((prev) => !prev);
  }

  // Refresh handler for AlphaVantage data
  const handleRefreshData = async () => {
    if (!currentTicker) return;
    // Invalidate all relevant caches
    const ticker = currentTicker.symbol;
    // Market cap
    localStorage.removeItem(`marketcap_${ticker}`);
    // Fundamentals
    localStorage.removeItem(`financialData_${ticker}`);
    // Dividends
    localStorage.removeItem(`dividendData_${ticker}`);
    // Insider trades
    localStorage.removeItem(`insiderData_${ticker}`);
    // News
    localStorage.removeItem(`newsData_${ticker}`);
    // Shares outstanding
    localStorage.removeItem(`sharesOutstanding_${ticker}`);
    // Optionally, clear any other custom caches here

    // Reset state to force re-fetch
    setMarketCap("");
    setMarketCapCurrency("");
    setActiveTicker("");
    setTimeout(() => setActiveTicker(ticker), 0);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-dashboard-bg">
        <div className="w-full sticky top-0 z-40" style={{ backgroundColor: '#fff' }}>
          <DashboardHeader 
            ticker={currentTicker}
            marketCap={marketCap}
            marketCapCurrency={marketCapCurrency}
            onOpenCommentariesSidebar={handleOpenCommentariesSidebar}
            selectedTickers={selectedTickers}
            onOpenAssistant={hasBuffettTier ? handleOpenAssistant : undefined}
            showAssistantButton={hasBuffettTier}
            onRefreshData={handleRefreshData}
          />
        </div>
        <div className="flex flex-1">
          <DashboardSidebar
            tickers={selectedTickers}
            activeTicker={activeTicker}
            onTickerSelect={handleSelectTicker}
            onTickerRemove={removeTicker}
            onAddTicker={addTicker}
            email={userEmail}
          />
          <main className="flex-1 p-6">
            {currentTicker ? (
              <MainDashboard
                ticker={currentTicker}
                marketCap={marketCap}
                marketCapCurrency={marketCapCurrency}
                commentariesSidebarOpen={commentariesSidebarOpen}
                setCommentariesSidebarOpen={setCommentariesSidebarOpen}
                onProvideAssistantData={setAssistantClientData}
              />
            ) : (
              <GetStarted onAddTicker={addTicker} />
            )}
            {/* Assistant chatbox at bottom */}
            {assistantOpen && currentTicker && (
              <div
                className="fixed bottom-0 right-0 z-50 pb-4 pr-4 pointer-events-auto"
                style={{ width: '100%', maxWidth: '420px' }}
              >
                <div className="max-w-md w-full relative bg-white border border-gray-300 rounded-lg shadow-lg" style={{ backgroundColor: '#fff' }}>
                  {/* Exit button */}
                  <button
                    className="absolute top-2 right-2 z-10 bg-gray-100 hover:bg-gray-200 rounded-full p-2 shadow"
                    aria-label="Close chatbox"
                    onClick={() => setAssistantOpen(false)}
                  >
                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>&times;</span>
                  </button>
                  <ChatAssistant ticker={currentTicker.symbol} clientData={assistantClientData ?? undefined} />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};