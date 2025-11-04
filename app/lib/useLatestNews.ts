

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function useLatestNews(ticker: string) {
  const [news, setNews] = useState<Array<{ year: number; month_end: number; news_output: string }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;

    const fetchAllNews = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("news_output")
          .select("year, month_end, news_output")
          .eq("ticker", ticker)
          .order("year", { ascending: false })
          .order("month_end", { ascending: false });

        if (error) {
          console.error(`[useLatestNews] Query error:`, error);
          setError("Failed to fetch news.");
          setNews(null);
        } else if (data && Array.isArray(data)) {
          setNews(data);
        } else {
          setNews(null);
        }
      } catch (e) {
        console.error(`[useLatestNews] Unexpected exception while fetching news:`, e);
        setError("Failed to fetch latest news.");
        setNews(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAllNews();
  }, [ticker]);

  return { news, loading, error };
}
