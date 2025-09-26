"use client"
import React, { useState } from "react"
import HeaderVariation from "components/sections/Header_Variation" 

// Copy of the standard form, but with maxTickers set to 20 for premium users


type PlanType = "Munger" | "Buffett" | null
type Ticker = { ticker: string; name: string }


export default function PremiumFormSection() {
  const [email, setEmail] = useState("")
  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState<Ticker[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedTickers, setSelectedTickers] = useState<Ticker[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [_showMaxTickersPopup, setShowMaxTickersPopup] = useState(false)
  const [plan, setPlan] = useState<PlanType>(null)
  const [planError, setPlanError] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const maxTickers = plan === "Buffett" ? 20 : 10

  // Fetch plan on email blur
  const handleEmailBlur = async () => {
    setPlan(null)
    setPlanError(null)
    if (!email) return
    try {
      const res = await fetch("/api/get-stripe-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = (await res.json()) as { plan?: string }
  if (data.plan === "Munger" || data.plan === "Buffett") {
        setPlan(data.plan)
      } else {
        setPlan(null)
        setPlanError("No premium plan found for this email.")
      }
    } catch {
      setPlan(null)
      setPlanError("Error checking plan. Please try again.")
    }
  }

  const handleSearch = async (query: string) => {
    setSearch(query)
    if (query.length > 0) {
      setSearching(true)
      try {
        const response = await fetch(`/api/search_tickers?query=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data as Ticker[])
        } else {
          setSearchResults([])
        }
      } catch {
        setSearchResults([])
      }
      setSearching(false)
    } else {
      setSearchResults([])
      setSearching(false)
    }
  }

  const handleSelectTicker = (ticker: Ticker) => {
    if (selectedTickers.length < maxTickers && !selectedTickers.find((t) => t.ticker === ticker.ticker)) {
      setSelectedTickers([...selectedTickers, ticker])
    } else if (selectedTickers.length >= maxTickers) {
      setShowMaxTickersPopup(true)
    }
  }

  const handleRemoveTicker = (ticker: Ticker) => {
    setSelectedTickers(selectedTickers.filter((t) => t.ticker !== ticker.ticker))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (!agreedToTerms) {
      setMessage("You must agree to the Terms & Conditions to submit.")
      return
    }
    try {
      const res = await fetch("/api/submit-premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          tickers: selectedTickers.map((t) => t.ticker).join(","),
        }),
      })
      if (res.ok) {
  setMessage("Your selection has been updated successfully!")
  setEmail("")
  setSelectedTickers([])
  setAgreedToTerms(false)
      } else {
        const data = (await res.json()) as { error?: string }
        if (res.status === 403 && data.error?.includes("premium plan")) {
          setMessage("Sorry, we didn't find a premium plan for this email address. Please subscribe to have access!")
        } else {
          setMessage(data.error || "An error occurred while processing your form.")
        }
      }
    } catch {
      setMessage("An error occurred while processing your form.")
    }
  }

  return (
    <>
      <HeaderVariation />
      <main className="flex min-h-screen flex-col items-center bg-[#fdf6ee]">
  <div className="mt-16 w-full max-w-2xl rounded-xl bg-[#fdf6ee] p-8 shadow-xl text-black">
        <h1 className="mb-4 text-center text-4xl font-bold text-indigo-800">StockTickerNews Premium</h1>
        <p className="mb-8 text-center text-gray-700">
          Update your current selection, if you already have a premium subscription! Simply resubmit the full list of tickers you want to update your current one.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="mt-1 block w-full rounded-md border border-black bg-[#fdf6ee] shadow-sm focus:border-black focus:ring-black"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                required
              />
              {/* Plan check message below email input */}
              {plan === null && !planError && email && (
                <div className="text-gray-500 text-sm mt-1">Checking your premium plan and unlock ticker selection...</div>
              )}
              {planError && <div className="text-red-500 text-sm mt-1">{planError}</div>}
              {plan === "Buffett" && <div className="text-black text-sm mt-1">Buffett plan detected: select up to 20 companies.</div>}
              {plan === "Munger" && <div className="text-black text-sm mt-1">Munger plan detected: select up to 10 companies.</div>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Search Tickers</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border border-black bg-[#fdf6ee] shadow-sm focus:border-black focus:ring-black px-3 py-2 text-sm"
                placeholder="Type to search company name or ticker symbol..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searching && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="relative flex h-6 w-6">
                    <span className="animate-spin inline-block w-full h-full border-4 border-black border-t-black rounded-full"></span>
                  </span>
                  <span className="text-black font-medium">Searching...</span>
                </div>
              )}
              {searchResults.length > 0 && !searching && (
                <ul className="mt-2 max-h-40 overflow-y-auto rounded-md border bg-white shadow">
                  {searchResults.map((item) => (
                    <li
                      key={item.ticker}
                      className="cursor-pointer px-4 py-2 hover:bg-indigo-50"
                      onClick={() => handleSelectTicker(item)}
                    >
                      {item.ticker} - {item.name}
                    </li>
                  ))}
                </ul>
              )}
              <input type="hidden" name="tickers" value={selectedTickers.map((t) => t.ticker).join(",")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Selected Tickers</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedTickers.map((ticker) => (
                  <span
                    key={ticker.ticker}
                    className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800"
                  >
                    {ticker.ticker}
                    <button
                      type="button"
                      className="ml-2 text-indigo-500 hover:text-red-500"
                      onClick={() => handleRemoveTicker(ticker)}
                    >
                      &times;
                    </button>
                  </span>
                ))}
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              required
            />
            <label htmlFor="terms" className="text-sm text-gray-700">
              I agree to the <a href="/terms" target="_blank" className="text-indigo-600 underline">Terms &amp; Conditions</a>
            </label>
          </div>
          <button
            type="submit"
            className="w-full rounded-xl border border-black bg-[#fdf6ee] px-6 py-3 font-semibold text-black shadow transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!agreedToTerms}
          >
            Submit
          </button>
          <div className="mt-6 flex justify-center gap-4">
            <a
              href="/feedback"
              className="inline-block rounded-md border border-black bg-[#fdf6ee] px-6 py-3 font-semibold text-black shadow-lg transition hover:bg-blue-100 hover:text-blue-700 hover:scale-105 hover:shadow-2xl active:scale-95"
            >
              Leave Feedback
            </a>
            <a
              href="/unsubscribe"
              className="inline-block rounded-md border border-black bg-[#fdf6ee] px-6 py-3 font-semibold text-black shadow-lg transition hover:bg-blue-100 hover:text-blue-700 hover:scale-105 hover:shadow-2xl active:scale-95"
            >
              Unsubscribe
            </a>
          </div>
          {/* Success popover */}
          {message === "Your selection has been updated successfully!" && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="rounded-2xl bg-white/90 p-8 shadow-2xl max-w-sm w-full transform transition-all text-center">
                <p className="mb-6 text-center text-xl font-semibold text-green-700">
                  Your selection has been updated successfully!
                </p>
                <button
                  onClick={() => setMessage(null)}
                  className="mx-auto block w-full rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-3
                    text-white font-bold shadow-lg transition-all duration-300
                    hover:scale-105 hover:shadow-2xl active:scale-95"
                >
                  OK
                </button>
              </div>
            </div>
          )}
          {/* Other messages */}
          {message && message !== "Your selection has been updated successfully!" && (
            <div className="alert alert-info mt-4">{message}</div>
          )}
  </div>
  </form>
      </div>
      </main>
    </>
  )
}
