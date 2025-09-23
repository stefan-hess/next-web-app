"use client"

import React, { useState } from "react"

export default function FeedbackPage() {
  const [email, setEmail] = useState("")
  const [feedback, setFeedback] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          feedback,
        }),
      })
      if (res.ok) {
        setMessage("Thank you for your feedback!")
        setEmail("")
        setFeedback("")
      } else {
        setMessage("An error occurred while submitting your feedback.")
      }
    } catch {
      setMessage("An error occurred while submitting your feedback.")
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="mt-16 w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
        <h1 className="mb-4 text-center text-3xl font-bold text-indigo-800">Feedback</h1>
        <p className="mb-8 text-center text-gray-700">
          We value your feedback! Please let us know your thoughts below, what features you might like or what improvement points you see in our website or product.
        </p>
        {message && <div className="mb-4 text-center font-semibold text-green-600">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Your Feedback</label>
            <textarea
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows={4}
              placeholder="Enter your feedback here..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            Submit Feedback
          </button>
        </form>
      </div>
    </main>
  )
}
