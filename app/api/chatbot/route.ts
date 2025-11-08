export const runtime = "nodejs";

import { NextRequest } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

// This chatbot focuses on the raw full extracts visible in the Report Filings tab.

async function buildContext(ticker: string, clientData?: any) {
  if (clientData) {
    // Use client-provided data for context
    return {
      ticker,
      reports: {
        annual: Array.isArray(clientData.annual) ? clientData.annual : [],
        quarterly: Array.isArray(clientData.quarterly) ? clientData.quarterly : [],
      },
      shares: Array.isArray(clientData.shares) ? clientData.shares : [],
      news: Array.isArray(clientData.news) ? clientData.news : [],
      insider: Array.isArray(clientData.insider) ? clientData.insider : [],
      dividends: Array.isArray(clientData.dividends) ? clientData.dividends : [],
    };
  }
  // Fallback: fetch from Supabase
  const supa = getSupabaseService();
  // ...existing code for Supabase queries...
  const { data: fundamentals } = await supa
    .from("cached_fundamentals")
    .select("*")
    .eq("ticker", ticker)
    .limit(1);
  const annual = Array.isArray(fundamentals?.[0]?.annual) ? (fundamentals![0]!.annual as unknown[]) : [];
  const quarterly = Array.isArray(fundamentals?.[0]?.quarterly) ? (fundamentals![0]!.quarterly as unknown[]) : [];
  const { data: shares } = await supa
    .from("shares_outstanding_cache")
    .select("*")
    .eq("ticker", ticker)
    .order("date", { ascending: false })
    .limit(100);
  const { data: news } = await supa
    .from("news_output")
    .select("year, month_end, news_output")
    .eq("ticker", ticker)
    .order("year", { ascending: false })
    .order("month_end", { ascending: false })
    .limit(36);
  const { data: insider } = await supa
    .from("insider_trades_cache")
    .select("*")
    .eq("ticker", ticker)
    .order("transaction_date", { ascending: false })
    .limit(1000);
  const { data: dividends } = await supa
    .from("dividend_history_cache")
    .select("*")
    .eq("ticker", ticker)
    .order("ex_dividend_date", { ascending: false })
    .limit(100);
  return {
    ticker,
    reports: {
      annual,
      quarterly,
    },
    shares: (shares ?? []) as unknown[],
    news: (news ?? []) as unknown[],
    insider: (insider ?? []) as unknown[],
    dividends: (dividends ?? []) as unknown[],
  };
}

export async function POST(req: NextRequest) {
  try {
    const { messages, ticker, clientData } = (await req.json()) as {
      messages: { role: "user" | "system" | "assistant"; content: string }[];
      ticker: string;
      clientData?: any;
    };

    // Debug: log received clientData
    console.log("[Chatbot API] Received clientData:", JSON.stringify(clientData, null, 2));

    if (!ticker || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
    }

    const context = await buildContext(ticker, clientData);

    // Debug: log constructed context
    console.log("[Chatbot API] Constructed context:", JSON.stringify(context, null, 2));

    const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });
    const system = [
      "You are a finance research assistant.",
      "You are given raw context for a single ticker: reports.quarterly/annual (full extracts), shares (outstanding and market cap series), news (news_output), insider (insider_trades), and dividends.",
      "Base your analysis strictly on these arrays. Compute metrics on demand and reference the exact fields used (e.g., totalRevenue, netIncome, market_cap_*).",
      "If a needed field is missing, state that briefly instead of assuming.",
      "Answer concisely, focusing on valuation-related calculations, trends in the raw series, insider/dividend signals, and factual red flags.",
      "Do not provide investment advice."
    ].join(" ");

    const userContext = `CONTEXT (JSON):\n${JSON.stringify(context).slice(0, 1000000)}\nEND CONTEXT.\n\nUser question: ${messages[messages.length - 1]?.content ?? ""}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContext },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ reply: text }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Chat failed", details: String(e) }), { status: 500 });
  }
}