import { useEffect, useState } from "react";

export interface DividendEntry {
  ex_dividend_date?: string;
  declaration_date?: string;
  record_date?: string;
  payment_date?: string;
  amount?: string;
}

export function useDividendData(ticker: string) {
  const [data, setData] = useState<DividendEntry[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    fetch(`/api/data/dividend_data?ticker=${encodeURIComponent(ticker)}`)
      .then((res) => res.json())
      .then((json) => {
        const dataObj = json as Record<string, DividendEntry[]>;
        if (dataObj && typeof dataObj === "object" && ticker in dataObj) {
          setData(dataObj[ticker] as DividendEntry[]);
        } else {
          setData([]);
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch dividend data");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [ticker]);

  return { data, loading, error };
}
