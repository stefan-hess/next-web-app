"use client"

import React, { useState } from "react"
import Header from "components/sections/Header"


export default function ContactPage() {
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          content,
        }),
      });
      if (res.ok) {
        setMessage("Thank you for contacting us! We'll get back to you soon.");
        setEmail("");
        setContent("");
      } else {
        setMessage("An error occurred while submitting your message.");
      }
    } catch {
      setMessage("An error occurred while submitting your message.");
    }
  };

  return (
  <main id="contactus" className="flex min-h-[50vh] flex-col items-center bg-[#fdf6ee]">
    <div className="mt-2 w-full max-w-md rounded-xl bg-[#fdf6ee] p-6 shadow-xl border border-border mb-12">
        <div className="flex flex-col items-center justify-center space-y-4 mb-8">
          <h1 className="w-full text-3xl lg:text-5xl font-bold text-foreground text-center flex flex-col items-center">
            <span>Contact Us</span>
          </h1>
          <p className="w-full text-xl text-muted-foreground max-w-3xl text-center">
            Have a question, suggestion, or want to get in touch? Shoot us a message and our team will respond as soon as possible.
          </p>
        </div>
        {message && <div className="mb-4 text-center font-semibold text-green-600">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="mt-1 block w-full rounded-md border-black border shadow-sm focus:border-black focus:ring-indigo-500 bg-[#fdf6ee] placeholder-gray-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              className="mt-1 block w-full rounded-md border-black border shadow-sm focus:border-black focus:ring-indigo-500 bg-[#fdf6ee] placeholder-gray-400 placeholder:text-sm p-3"
              rows={4}
              placeholder="Enter your message here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-[#fdf6ee] px-6 py-3 font-semibold text-black border border-black transition hover:bg-blue-100 hover:text-blue-700 hover:scale-105 hover:shadow-lg active:scale-95"
          >
            Send Message
          </button>
        </form>
      </div>
    </main>
  )
}