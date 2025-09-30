import { useEffect, useState } from "react";

// Usage: const { data, loading, error } = useCachedFinancialData(ticker)
export function useCachedFinancialData(ticker: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    const cacheKey = `financialData_${ticker}`;
    const cache = localStorage.getItem(cacheKey);
    let cached: { data?: any; timestamp?: number } | null;
    try {
      cached = cache ? (JSON.parse(cache) as { data?: any; timestamp?: number }) : null;
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
    fetch(`/api/fundamentals_data?ticker=${encodeURIComponent(ticker)}`)
      .then(res => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(json => {
        setData(json);
        localStorage.setItem(cacheKey, JSON.stringify({ data: json, timestamp: now }));
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
