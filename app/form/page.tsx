"use client"
import React, { useState } from "react"

type Ticker = { ticker: string; name: string }

export default function FormSection() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState<Ticker[]>([])
  const [selectedTickers, setSelectedTickers] = useState<Ticker[]>([])
  const [feedback, setFeedback] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const maxTickers = 5

  const handleSearch = async (query: string) => {
    setSearch(query)
    if (query.length > 0) {
      try {
        const response = await fetch(`/search_tickers?query=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setSearchResults(data as Ticker[])
        } else {
          setSearchResults([])
        }
      } catch {
        setSearchResults([])
      }
    } else {
      setSearchResults([])
    }
  }

  const handleSelectTicker = (ticker: Ticker) => {
    if (selectedTickers.length < maxTickers && !selectedTickers.find((t) => t.ticker === ticker.ticker)) {
      setSelectedTickers([...selectedTickers, ticker])
    }
  }

  const handleRemoveTicker = (ticker: Ticker) => {
    setSelectedTickers(selectedTickers.filter((t) => t.ticker !== ticker.ticker))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          tickers: selectedTickers.map((t) => t.ticker).join(","),
          feedback,
        }),
      })
      if (res.ok) {
        setMessage("Form submitted successfully!")
        setFirstName("")
        setLastName("")
        setEmail("")
        setSelectedTickers([])
        setFeedback("")
      } else {
        setMessage("An error occurred while processing your form.")
      }
    } catch {
      setMessage("An error occurred while processing your form.")
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="mt-16 w-full max-w-2xl rounded-xl bg-white p-8 shadow-xl">
        <h1 className="mb-4 text-center text-4xl font-bold text-indigo-800">StockTickerNews</h1>
        <p className="mb-8 text-center text-gray-700">
          Hey there. This is a monthly stock ticker newsletter that automatically sends a summary of recent events for
          companies on your watch list to your email. Save time researching news! For now, you can select 5 companies on
          the NYSE and NASDAQ. Expansion to other stock exchanges and a premium version are coming soon. We’d love your
          feedback below!
        </p>
        {message && <div className="mb-4 text-center font-semibold text-green-600">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
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
            <label className="block text-sm font-medium text-gray-700">Search Tickers</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Type to search company name or ticker symbol..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchResults.length > 0 && (
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
            <input type="hidden" name="tickers" value={selectedTickers.map((t) => t.ticker).join(",")} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Your Feedback</label>
            <textarea
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows={4}
              placeholder="Enter your feedback here..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            Submit
          </button>
        </form>
      </div>
    </main>
  )
}
