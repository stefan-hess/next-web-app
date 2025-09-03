import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Next.js Enterprise Boilerplate",
  twitter: {
    card: "summary_large_image",
  },
  openGraph: {
    url: "https://next-enterprise.vercel.app/",
    images: [
      {
        width: 1200,
        height: 630,
        url: "https://raw.githubusercontent.com/Blazity/next-enterprise/main/.github/assets/project-logo.png",
      },
    ],
  },
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="mt-16 w-full max-w-2xl rounded-xl bg-white p-8 shadow-xl">
        <h1 className="mb-4 text-center text-4xl font-bold text-indigo-800">StockTickerNews</h1>
        <p className="mb-8 text-center text-gray-700">
          Welcome to StockTickerNews! Get monthly summaries of recent events for companies on your watch list delivered
          to your email. Select up to 5 companies from NYSE and NASDAQ. Expansion to other exchanges and premium
          features coming soon.
        </p>
        <div className="flex justify-center">
          <a
            href="/form"
            className="inline-block rounded-md bg-indigo-600 px-8 py-3 text-lg font-semibold text-white transition hover:bg-indigo-700"
          >
            Get Started
          </a>
        </div>
      </div>
    </main>
  )
}
