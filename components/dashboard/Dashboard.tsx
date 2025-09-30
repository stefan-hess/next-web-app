"use client";

import { useState, useEffect } from "react";
import { SidebarProvider } from "components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "components/dashboard/DashboardHeader";
import { MainDashboard } from "components/dashboard/MainDashboard";
import { GetStarted } from "components/dashboard/GetStarted";
import { supabase } from "app/lib/supabaseClient";

export interface Ticker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export const Dashboard = () => {
  const [userEmail, setUserEmail] = useState("");
  const [selectedTickers, setSelectedTickers] = useState<Ticker[]>([]);
  const [activeTicker, setActiveTicker] = useState("");
  const [marketCap, setMarketCap] = useState<string>("");
  const [marketCapCurrency, setMarketCapCurrency] = useState<string>("");
  // Helper for scaling market cap
  function autoScale(values: string[], currency: string) {
    const nums = values.map(v => {
      const n = Number(v.replace(/,/g, ""));
      return isNaN(n) ? 0 : Math.abs(n);
    });
    const m = Math.max(...nums, 0);
    if (m >= 1e10) return { scale: 1e9, label: `Billions ${currency}` };
    if (m >= 1e7)  return { scale: 1e6, label: `Millions ${currency}` };
    if (m >= 1e4)  return { scale: 1e3, label: `Thousands ${currency}` };
    return { scale: 1, label: currency };
  }

  // Fetch logged-in user's email once
  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Failed to fetch user:", error);
        return;
      }
      setUserEmail(data.user?.email || "");
    };
    fetchUserEmail();
  }, []);

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
      } catch (err) {
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-dashboard-bg">
        <DashboardHeader 
          ticker={currentTicker}
          marketCap={marketCap}
          marketCapCurrency={marketCapCurrency}
        />
        <div className="flex flex-1">
          <DashboardSidebar
            tickers={selectedTickers}
            activeTicker={activeTicker}
            onTickerSelect={setActiveTicker}
            onTickerRemove={removeTicker}
            onAddTicker={addTicker}
            email={userEmail}
          />
          <main className="flex-1 p-6">
            {selectedTickers.length === 0 ? (
              <GetStarted onAddTicker={addTicker} />
            ) : (
              currentTicker && (
                <MainDashboard 
                  ticker={currentTicker} 
                  marketCap={marketCap} 
                  marketCapCurrency={marketCapCurrency} 
                />
              )
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};