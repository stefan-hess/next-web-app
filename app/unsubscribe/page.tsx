"use client"

import React, { useState } from "react"
import Footer from "components/sections/Footer"
import Header from "components/sections/Header"

export default function UnsubscribePage() {
  const [email, setEmail] = useState("")
  const [feedback, setFeedback] = useState("")
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        // Submit optional feedback
        if (feedback.trim()) {
          try {
            await fetch("/api/feedback", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, feedback: feedback.trim() }),
            })
            setFeedbackSent(true)
          } catch {
            // Feedback failure is non-blocking
          }
        }
        setSuccess(true)
        setMessage("You have been unsubscribed. You will no longer be charged.")
        setEmail("")
      } else {
        setMessage("An error occurred. Please check your email and try again.")
      }
    } catch {
      setMessage("An error occurred. Please try again later.")
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fdf6ee]">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-20">
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white p-10 text-center shadow-card">
          {/* Decorative bee in background */}
          <Image
            src="/assets/icon/icon_v1.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-8 -right-8 h-52 w-52 select-none opacity-10"
            style={{ transform: "rotate(20deg)" }}
            width={208}
            height={208}
            priority
          />

          {success ? (
            <div className="space-y-6">
              {/* Checkmark icon */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Unsubscribed</h1>
                <p className="text-base text-muted-foreground">{message}</p>
                {feedbackSent && (
                  <p className="text-sm text-muted-foreground">Thank you for your feedback — it helps us improve!</p>
                )}
              </div>
              <Link
                href="/"
                className="inline-block w-full rounded-lg border-2 px-8 py-3 text-base font-bold shadow transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
                style={{ borderColor: "#bfa76a", color: "#bfa76a", background: "transparent" }}
              >
                Back to Home
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Sad bee icon */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Unsubscribe</h1>
                <p className="text-base text-muted-foreground">
                  Sorry to see you go! Enter your email below to cancel your subscription.
                  Please let us know what we can change in order to win you back!
                </p>
              </div>
              {message && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {message}
                </div>
              )}
              <form onSubmit={handleUnsubscribe} className="space-y-4 text-left">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm transition focus:border-[#bfa76a] focus:outline-none focus:ring-2 focus:ring-[#bfa76a]/30"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Feedback <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm transition focus:border-[#bfa76a] focus:outline-none focus:ring-2 focus:ring-[#bfa76a]/30"
                    placeholder="Please let us know what we can improve!"
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg border-2 border-red-400 bg-transparent px-8 py-3 text-base font-bold text-red-500 shadow transition-transform duration-300 hover:-translate-y-0.5 hover:border-red-500 hover:bg-red-50 hover:shadow-lg active:scale-95"
                >
                  Unsubscribe
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
