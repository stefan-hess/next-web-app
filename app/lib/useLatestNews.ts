

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function useLatestNews(ticker: string) {
  const [news, setNews] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    console.log(`[useLatestNews] Attempting connection to Supabase table 'news_output'...`);
    supabase
      .from("news_output")
      .select("news_output")
      .eq("ticker", ticker)
      .eq("year", currentYear)
      .eq("month", prevMonth)
      .single()
      .then((response) => {
        const { data, error } = response;
        console.log(`[useLatestNews] Full previous month response:`, response);
        if (error) {
          console.error(`[useLatestNews] Connection or query error:`, error);
        } else {
          console.log(`[useLatestNews] Connection to table 'news_output' successful.`);
        }
        console.log(`[useLatestNews] Querying previous month: ticker=${ticker}, year=${currentYear}, month=${prevMonth}`);
        console.log(`[useLatestNews] Previous month result: error=${error}, data=${JSON.stringify(data)}`);
        if (error || !data) {
          // Try current month if previous month not found
          console.log(`[useLatestNews] Querying current month: ticker=${ticker}, year=${currentYear}, month=${currentMonth}`);
          supabase
            .from("news_output")
            .select("news_output")
            .eq("ticker", ticker)
            .eq("year", currentYear)
            .eq("month", currentMonth)
            .single()
            .then((response) => {
              const { data, error } = response;
              console.log(`[useLatestNews] Full current month response:`, response);
              if (error) {
                console.error(`[useLatestNews] Connection or query error:`, error);
              } else {
                console.log(`[useLatestNews] Connection to table 'news_output' successful.`);
              }
              console.log(`[useLatestNews] Current month result: error=${error}, data=${JSON.stringify(data)}`);
              if (error || !data) {
                setNews(null);
                setError("No news found for latest months.");
              } else {
                setNews(data.news_output);
              }
              setLoading(false);
            });
        } else {
          setNews(data.news_output);
          setLoading(false);
        }
      });
  }, [ticker]);

  return { news, loading, error };
}
