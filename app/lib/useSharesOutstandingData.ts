import { useEffect, useState } from "react";

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

export function useSharesOutstandingData(ticker: string): UseSharesOutstandingDataResult {
  const [data, setData] = useState<Record<string, string>[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    fetch(`/api/data/shares_outstanding_data?ticker=${ticker}`)
      .then((res) => res.json() as Promise<SharesOutstandingResponse>)
      .then((json) => {
        const raw = (json?.shares_outstanding?.[ticker] ?? []);
        // Coerce all values to strings for FinancialCard compatibility
        const coerced = raw.map((row) => {
          const out: Record<string, string> = {};
          Object.entries(row).forEach(([k, v]) => {
            if (v === null || v === undefined) return;
            // Preserve date as string as-is; convert others via String()
            out[k] = typeof v === 'string' ? v : String(v);
          });
          return out;
        });
        setData(coerced);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, [ticker]);

  return { data, loading, error };
}
