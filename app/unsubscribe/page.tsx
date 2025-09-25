"use client"

import React, { useState } from "react"
import Header_Variation from "components/sections/Header_Variation"

export default function UnsubscribePage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)

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
        setMessage("You have been unsubscribed from the newsletter.")
        setEmail("")
      } else {
        setMessage("An error occurred. Please check your email and try again.")
      }
    } catch {
      setMessage("An error occurred. Please try again later.")
    }
  }

  return (
    <>
    <Header_Variation />
  <main className="flex min-h-screen flex-col items-center bg-[#fdf6ee]">
  <div className="mt-16 w-full max-w-md rounded-xl bg-[#fdf6ee] p-8 shadow-xl">
        <h1 className="mb-4 text-center text-3xl font-bold text-indigo-800">Unsubscribe</h1>
        <p className="mb-8 text-center text-gray-700">
          Sorry to see you go! Enter your email address below to unsubscribe from the StockTickerNews product. You will no longer be charged.
        </p>
        {message && <div className="mb-4 text-center font-semibold text-red-600">{message}</div>}
        <form onSubmit={handleUnsubscribe} className="space-y-6">
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
          <button
            type="submit"
            className="w-full rounded-md bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            Unsubscribe
          </button>
        </form>
      </div>
    </main>
    </>
  )
}
