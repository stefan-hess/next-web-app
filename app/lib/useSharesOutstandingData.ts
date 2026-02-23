import { useEffect, useRef, useState } from "react";

interface SharesOutstandingRow {
  date?: string | number | null;
  shares_outstanding_basic?: number | string | null;
  shares_outstanding_diluted?: number | string | null;
  market_cap_undiluted?: number | string | null;
  market_cap_diluted?: number | string | null;
  [key: string]: unknown;
}

interface SharesOutstandingResponse {
  shares_outstanding?: Record<string, SharesOutstandingRow[]>;
}

interface UseSharesOutstandingDataResult {
  data: Record<string, string>[] | null;
  loading: boolean;
  error: string | null;
}

function coerceToStringRecords(rows: SharesOutstandingRow[]): Record<string, string>[] {
  return rows.map((row) => {
    const out: Record<string, string> = {};
    Object.entries(row).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      out[k] = typeof v === "string" ? v : String(v);
    });
    return out;
  });
}

export function useSharesOutstandingData(ticker: string): UseSharesOutstandingDataResult {
  const [data, setData] = useState<Record<string, string>[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const lastRequestedTickerRef = useRef<string>("");

  useEffect(() => {
    if (!ticker) return;
    lastRequestedTickerRef.current = ticker;
    setLoading(true);
    setError(null);

    // Check localStorage cache (1-hour TTL)
    const cacheKey = `sharesOutstanding_${ticker}`;
    const cached = localStorage.getItem(cacheKey);
    let parsed: { data?: Record<string, string>[]; timestamp?: number } | null = null;
    try {
      parsed = cached ? (JSON.parse(cached) as { data?: Record<string, string>[]; timestamp?: number }) : null;
    } catch {
      parsed = null;
    }
    const now = Date.now();
    if (parsed?.timestamp && now - parsed.timestamp < 3600_000 && Array.isArray(parsed.data) && parsed.data.length > 0) {
      setData(parsed.data);
      setLoading(false);
      return;
    }

    // Fetch from API; abort on ticker change or unmount
    const controller = new AbortController();

    fetch(`/api/data/shares_outstanding_data?ticker=${encodeURIComponent(ticker)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json() as Promise<SharesOutstandingResponse>;
      })
      .then((json) => {
        if (lastRequestedTickerRef.current !== ticker) return;
        const raw = json?.shares_outstanding?.[ticker] ?? [];
        const coerced = coerceToStringRecords(raw);

        // Only update state if the response has data, or we have no cached data at all
        if (coerced.length > 0) {
          setData(coerced);
          localStorage.setItem(cacheKey, JSON.stringify({ data: coerced, timestamp: now }));
        } else if (!parsed?.data?.length) {
          // No cached data and API returned empty — set empty so UI shows "no data"
          setData([]);
        }
        // Otherwise: API returned empty but we have stale cache — keep showing stale data
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        if (lastRequestedTickerRef.current !== ticker) return;
        setError(String(err));
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
