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
      <div className="flex flex-col w-full bg-[#fdf6ee]" style={{ height: '100vh', overflow: 'hidden' }}>
        <div className="flex-shrink-0 w-full z-40" style={{ backgroundColor: '#fff' }}>
          <DashboardHeader
            ticker={currentTicker}
            marketCap={marketCap}
            marketCapCurrency={marketCapCurrency}
            selectedTickers={selectedTickers}
            onOpenAssistant={hasBuffettTier ? handleOpenAssistant : undefined}
            showAssistantButton={hasBuffettTier}
            onRefreshData={handleRefreshData}
          />
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <DashboardSidebar
            tickers={selectedTickers}
            activeTicker={activeTicker}
            onTickerSelect={handleSelectTicker}
            onTickerRemove={removeTicker}
            onAddTicker={addTicker}
            email={userEmail}
          />
          <main className="flex-1 p-6 min-w-0 overflow-auto">
            {currentTicker ? (
              <MainDashboard
                ticker={currentTicker}
                marketCap={marketCap}
                marketCapCurrency={marketCapCurrency}
                onProvideAssistantData={setAssistantClientData}
              />
            ) : (
              <GetStarted onAddTicker={addTicker} />
            )}
          </main>
          {/* AI Assistant overlay — fixed on the right, transforms in/out (does not change layout) */}
          {currentTicker && (
            <div
              aria-hidden={!assistantOpen}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                height: '100vh',
                width: 400,
                backgroundColor: '#fdf6ee',
                boxShadow: '-4px 0 12px rgba(0,0,0,0.06)',
                transform: assistantOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 300ms ease-in-out',
                zIndex: 60,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
                <span className="font-semibold text-sm truncate">
                  AI Assistant{currentTicker ? ` — ${currentTicker.symbol}` : ""}
                </span>
                <button
                  onClick={() => setAssistantOpen(false)}
                  className="ml-2 flex-shrink-0 text-xl leading-none opacity-60 hover:opacity-100 transition-opacity"
                  aria-label="Close assistant"
                >
                  &times;
                </button>
              </div>
              <div className="flex-1 min-h-0 p-3 flex flex-col">
                <ChatAssistant ticker={currentTicker.symbol} clientData={assistantClientData ?? undefined} />
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
};