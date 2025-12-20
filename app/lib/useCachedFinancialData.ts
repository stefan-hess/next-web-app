import { useEffect, useRef, useState } from "react";

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
  const lastRequestedTickerRef = useRef<string>("");

  useEffect(() => {
    if (!ticker) return;
    lastRequestedTickerRef.current = ticker;
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
    // Fetch from API, abort previous in-flight requests on ticker change
    const controller = new AbortController();
    const signal = controller.signal;

    // Cleanup abort on ticker change/unmount
    // Note: we return cleanup at the end of effect

    fetch(`/api/data/fundamentals_data?ticker=${encodeURIComponent(ticker)}`, { signal, cache: "no-store" })
      .then(res => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then(json => {
        // Guard against race conditions: only apply if this response matches latest requested ticker
        if (lastRequestedTickerRef.current !== ticker) return;
        setData(json as FinancialData);
        localStorage.setItem(cacheKey, JSON.stringify({ data: json as FinancialData, timestamp: now }));
      })
      .catch(err => {
        if (err?.name === 'AbortError') return; // ignore aborted requests
        setError(err.message || "Unknown error");
      })
      .finally(() => {
        if (lastRequestedTickerRef.current === ticker) setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [ticker]);

  return { data, loading, error };
}
