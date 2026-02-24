"use client";

import DOMPurify from "dompurify";
import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

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
    <div className="flex flex-col h-full min-h-0">
      <style>{`
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .msg-in { animation: msgIn 0.18s ease-out both; }
      `}</style>

      {/* Messages — scrollable, fills available height */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 text-sm pb-2">
        {msgs.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground text-center pt-6">
            Ask me about valuation, trends, red flags…
          </p>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`msg-in ${m.role === "user" ? "text-right" : "text-left"}`}>
            <span
              className={`inline-block px-3 py-2 rounded-2xl text-sm whitespace-pre-line ${m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}
              dangerouslySetInnerHTML={m.role === "assistant" ? { __html: DOMPurify.sanitize(formatAssistantReply(m.content)) } : undefined}
            >
              {m.role === "user" ? m.content : undefined}
            </span>
          </div>
        ))}
        {loading && <div className="text-xs text-muted-foreground pl-1 msg-in">Thinking…</div>}
        {error && <div className="text-xs text-red-600 pl-1">{error}</div>}
        <div ref={bottomRef} />
      </div>

      {/* Input row pinned to bottom */}
      <div className="flex-shrink-0 flex items-end gap-2 pt-2 border-t border-border">
        <input
          className="flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Message AI Assistant…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <button
          onClick={send}
          disabled={loading || !ticker || !input.trim()}
          className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: input.trim() ? '#2563eb' : '#d1d5db' }}
          aria-label="Send"
        >
          <ArrowUp className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  );
}