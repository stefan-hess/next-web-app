"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { MainDashboard } from "../dashboard/MainDashboard";

const DemoDashboard = () => {
  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY;
      if (springRef.current) {
        springRef.current.style.transform = `translateY(${scrollY * 0.1}px)`;
      }
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const springRef = useRef<HTMLDivElement>(null);
  const [ticker, setTicker] = useState("");
  const [submittedTicker, setSubmittedTicker] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  // dashboardData is an object with ticker symbol keys mapping to { annual: FinancialReport[], quarterly: FinancialReport[] }
  interface FinancialReport {
    [key: string]: string | number | null | undefined;
  }
  interface FundamentalsData {
    [ticker: string]: {
      annual: FinancialReport[];
      quarterly: FinancialReport[];
    };
  }
  const [dashboardData, setDashboardData] = useState<FundamentalsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim() && !locked) {
      const upperTicker = ticker.trim().toUpperCase();
      setSubmittedTicker(upperTicker);
    const springRef = useRef<HTMLDivElement>(null); // Parallax ref for spring image
      setLocked(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("demoTicker", upperTicker);
        localStorage.setItem("demoTickerLocked", "true");
      }
    }
  };

  useEffect(() => {
    if (submittedTicker) {
      setLoading(true);
      setError(null);
      setDashboardData(null);
      fetch(`/api/data/fundamentals_data?ticker=${submittedTicker}`)
        .then(res => {
          if (!res.ok) throw new Error("Ticker not found or API error");
          return res.json();
        })
        .then(data => {
          setDashboardData(data as FundamentalsData);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [submittedTicker]);

  // On mount, restore ticker from localStorage if locked
  useEffect(() => {
    if (typeof window !== "undefined") {
      const lockedFlag = localStorage.getItem("demoTickerLocked");
      const savedTicker = localStorage.getItem("demoTicker");
      if (lockedFlag === "true" && savedTicker) {
        setSubmittedTicker(savedTicker);
        setTicker(savedTicker);
        setLocked(true);
      }
    }
  }, [submittedTicker]);

  return (
    <section id="productDemo" className="relative py-20 lg:py-32 bg-[#fdf6ee] overflow-hidden">
      <div ref={springRef} className="pointer-events-none absolute top-12 right-20 z-50" style={{ width: 320, height: 320 }}>
        <Image src="/assets/spring.png" alt="Spring" width={320} height={320} style={{ objectFit: 'contain' }} />
      </div>
      <div className="container mx-auto px-4 lg:px-8 max-w-8xl relative z-10">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground">Demo Dashboard</h2>
          <p className="w-full text-xl text-muted-foreground max-w-2xl mx-auto">Try the fundamental data platform.</p>
        </div>
  <div className="bg-[#fdf6ee] rounded-2xl shadow-xl p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="flex items-center justify-center gap-2 mb-8">
            <input
              type="text"
              value={ticker}
              onChange={e => setTicker(e.target.value)}
              placeholder="Enter ticker (e.g. AAPL)"
              className="border-2 border-financial-primary rounded-lg py-3 px-6 text-base font-bold text-financial-primary bg-transparent shadow w-64 focus:outline-none focus:ring-2 focus:ring-blue-300"
              style={{ minHeight: '48px' }}
              disabled={locked}
            />
            <button
              type="submit"
              className="bg-financial-primary text-black font-bold py-3 px-6 rounded-lg shadow text-base border-2 border-black focus:outline-black"
              style={{ minHeight: '48px' }}
              disabled={locked}
            >
              Search
            </button>
          </form>
          {loading && (
            <div className="text-center text-lg text-muted-foreground">Loading data for {submittedTicker}...</div>
          )}
          {error && (
            <div className="text-center text-red-500 font-semibold">{error}</div>
          )}
          {dashboardData && submittedTicker && dashboardData[submittedTicker] && (
            <MainDashboard
              ticker={{
                symbol: submittedTicker,
                name: submittedTicker,
                price: 0,
                change: 0,
                changePercent: 0,
                ...dashboardData[submittedTicker]
              }}
              commentariesSidebarOpen={false}
              setCommentariesSidebarOpen={() => {}}
              onProvideAssistantData={() => {}}
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default DemoDashboard;