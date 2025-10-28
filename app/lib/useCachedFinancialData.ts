import { useEffect, useState } from "react";

// Usage: const { data, loading, error } = useCachedFinancialData(ticker)
export interface FinancialData {
  [ticker: string]: {
    annual?: Record<string, string>[];
    quarterly?: Record<string, string>[];
  };
}

export function useCachedFinancialData(ticker: string) {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    const cacheKey = `financialData_${ticker}`;
    const cache = localStorage.getItem(cacheKey);
  let cached: { data?: FinancialData; timestamp?: number } | null;
    try {
  cached = cache ? (JSON.parse(cache) as { data?: FinancialData; timestamp?: number }) : null;
    } catch {
      cached = null;
    }
    const now = Date.now();
    if (cached?.timestamp && (now - cached.timestamp < 3600_000) && cached.data) {
      setData(cached.data);
      setLoading(false);
      return;
    }
    // Fetch from API
    fetch(`/api/data/fundamentals_data?ticker=${encodeURIComponent(ticker)}`)
      .then(res => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(json => {
        setData(json as FinancialData);
        localStorage.setItem(cacheKey, JSON.stringify({ data: json as FinancialData, timestamp: now }));
      })
      .catch(err => {
        setError(err.message || "Unknown error");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [ticker]);

  return { data, loading, error };
}
