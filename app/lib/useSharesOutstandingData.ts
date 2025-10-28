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
  const result = json as Record<string, Record<string, string>[]>;
  setData(result[ticker] || []);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, [ticker]);

  return { data, loading, error };
}
