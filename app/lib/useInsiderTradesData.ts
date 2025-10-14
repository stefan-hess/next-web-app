import { useEffect, useState } from "react";

export function useInsiderTradesData(ticker: string, maxTrades: number = 10) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    fetch(`/api/data/insider_trades_data?ticker=${encodeURIComponent(ticker)}&maxTrades=${maxTrades}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, [ticker, maxTrades]);

  return { data, loading, error };
}
