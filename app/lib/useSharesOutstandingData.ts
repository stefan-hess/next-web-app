import { useEffect, useState } from "react";

export function useSharesOutstandingData(ticker: string) {
  const [data, setData] = useState<Record<string, string>[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    fetch(`/api/data/shares_outstanding_data?ticker=${ticker}`)
      .then((res) => res.json())
      .then((json) => {
        // Expect shape: { shares_outstanding: { [ticker]: [ { date, shares_outstanding_basic, shares_outstanding_diluted, market_cap_undiluted, market_cap_diluted }, ... ] } }
        const j = json as any;
        const raw = (j?.shares_outstanding?.[ticker] ?? []) as Array<Record<string, unknown>>;
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
