

import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function useLatestNews(ticker: string) {
  const [news, setNews] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;

    const fetchLatestNews = async () => {
      setLoading(true);
      setError(null);

      try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;

        // Try previous month first
        const prevRes = await supabase
          .from("news_output")
          .select("news_output")
          .eq("ticker", ticker)
          .eq("year", currentYear)
          .eq("month_end", prevMonth)
          .maybeSingle();

        if (prevRes.error) {
          // Only log meaningful errors, skip empty objects or expected "no rows" cases
          if (prevRes.error.message) {
            console.error(`[useLatestNews] Query error (previous month):`, prevRes.error);
          }
        }

        if (prevRes.data?.news_output) {
          setNews(prevRes.data.news_output);
          setLoading(false);
          return;
        }

        // Fallback to current month
        const currRes = await supabase
          .from("news_output")
          .select("news_output")
          .eq("ticker", ticker)
          .eq("year", currentYear)
          .eq("month_end", currentMonth)
          .maybeSingle();

        if (currRes.error) {
          if (currRes.error.message) {
            console.error(`[useLatestNews] Query error (current month):`, currRes.error);
          }
        }

        if (currRes.data?.news_output) {
          setNews(currRes.data.news_output);
        } else {
          // No data for either month — treat as a normal empty state, not an error
          setNews(null);
          setError(null);
        }
      } catch (e) {
        // Only log real exceptions
        console.error(`[useLatestNews] Unexpected exception while fetching news:`, e);
        setError("Failed to fetch latest news.");
      } finally {
        setLoading(false);
      }
    };

    fetchLatestNews();
  }, [ticker]);

  return { news, loading, error };
}
