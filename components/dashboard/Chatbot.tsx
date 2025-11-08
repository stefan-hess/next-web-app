"use client";

import { useEffect, useState } from "react";

// Helper to format assistant replies for better readability
function formatAssistantReply(content: string): string {
  // Add line breaks after periods, colons, and before list items
  let formatted = content;
  formatted = formatted.replace(/\n/g, '<br/>');
  formatted = formatted.replace(/([\.!?])\s+/g, '$1<br/>');
  // Replace **phrase** with <strong>phrase</strong>
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/(As of|Current Ratio|Liquidity Position|Total Assets|Total Liabilities|Shareholder Equity|Cash Position)/gi, '<strong>$1</strong>');
  return formatted;
}


type ChatMsg = { role: "user" | "assistant"; content: string };

interface ClientData {
  annual?: unknown[];
  quarterly?: unknown[];
  shares?: unknown[];
  news?: unknown[];
  insider?: unknown[];
  dividends?: unknown[];
}

export default function ChatAssistant({ ticker, clientData }: { ticker: string; clientData?: ClientData }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore previous responses for this ticker from sessionStorage on mount or ticker change
  useEffect(() => {
    if (typeof window !== "undefined") {
      const restoredMsgs: ChatMsg[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(`chatbot_${ticker}_`)) {
          const question = key.replace(`chatbot_${ticker}_`, "");
          const answer = sessionStorage.getItem(key) || "";
          restoredMsgs.push({ role: "user", content: question });
          restoredMsgs.push({ role: "assistant", content: answer });
        }
      }
      setMsgs(restoredMsgs); // Always reset to only show relevant messages
    }
  }, [ticker]);

  const send = async () => {
    if (loading) return;
    if (!ticker) return;
    if (!input.trim()) return;
    const next: ChatMsg[] = [...msgs, { role: "user", content: input } as ChatMsg];
    setMsgs(next);
    setInput("");
    setError(null);
    setLoading(true);

    // Cache key based on ticker and question
    const cacheKey = `chatbot_${ticker}_${input.trim()}`;
    try {
      // Check sessionStorage for cached response
      if (typeof window !== "undefined") {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          setMsgs([...next, { role: "assistant", content: cached } as ChatMsg]);
          setLoading(false);
          return;
        }
      }
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, ticker, clientData }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string; details?: string };
        console.error("Chatbot API error:", body.error, body.details);
        throw new Error(body.error || `Request failed: ${res.status}`);
      }
      const data = (await res.json()) as { reply?: string };
      if (data?.reply) {
        setMsgs([...next, { role: "assistant", content: data.reply } as ChatMsg]);
        // Cache the response in sessionStorage
        if (typeof window !== "undefined") {
          sessionStorage.setItem(cacheKey, data.reply);
        }
      }
    } catch (e) {
      console.error("ChatAssistant error:", e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg bg-[hsl(var(--card)/1)] p-3 space-y-3">
  <div className="max-h-64 overflow-y-auto space-y-6 text-sm">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <span
              className={`inline-block px-2 py-1 rounded whitespace-pre-line ${m.role === "user" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
              dangerouslySetInnerHTML={m.role === "assistant" ? { __html: formatAssistantReply(m.content) } : undefined}
            >
              {m.role === "user" ? m.content : undefined}
            </span>
          </div>
        ))}
        {loading && <div className="text-xs text-muted-foreground">Thinking…</div>}
        {error && <div className="text-xs text-red-600">{error}</div>}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-2 py-1 text-sm"
          placeholder="Ask me about valuation, trends, red flags…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => (e.key === "Enter" ? send() : undefined)}
        />
        <button className="px-3 py-1 border rounded bg-blue-100 text-blue-700" onClick={send} disabled={loading || !ticker}>
          Send
        </button>
      </div>
    </div>
  );
}