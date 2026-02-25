"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";

interface Props {
  buttonLabel?: string;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
}

export default function RequestDemoModal({
  buttonLabel = "Request Demo",
  buttonClassName,
  buttonStyle,
}: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/request-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, company }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
        setName("");
        setCompany("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => { setOpen(true); setStatus("idle"); }}
        className={buttonClassName}
        style={buttonStyle}
      >
        {buttonLabel}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#fdf6ee] border border-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">Request a Demo</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Leave your details and we will reach out to schedule a personalised walkthrough.
            </DialogDescription>
          </DialogHeader>

          {status === "success" ? (
            <div className="py-6 text-center">
              <p className="text-lg font-semibold text-green-700">Thank you!</p>
              <p className="text-sm text-muted-foreground mt-1">We will be in touch shortly.</p>
              <button
                onClick={() => setOpen(false)}
                className="mt-6 w-full rounded-lg border-2 py-2.5 font-bold text-sm transition-opacity hover:opacity-80"
                style={{ borderColor: "#bfa76a", color: "#bfa76a" }}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#bfa76a] focus:ring-1 focus:ring-[#bfa76a]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#bfa76a] focus:ring-1 focus:ring-[#bfa76a]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Capital"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#bfa76a] focus:ring-1 focus:ring-[#bfa76a]"
                />
              </div>

              {status === "error" && (
                <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg border-2 py-2.5 font-bold text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ borderColor: "#bfa76a", color: "#bfa76a", background: "transparent" }}
              >
                {loading ? "Submitting…" : "Request Demo"}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
