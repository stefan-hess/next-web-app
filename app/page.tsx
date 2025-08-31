import { Metadata } from "next";
import { Button } from "components/Button/Button";
import { LP_GRID_ITEMS } from "lp-items";

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
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center">
      <div className="w-full max-w-2xl mt-16 bg-white rounded-xl shadow-xl p-8">
        <h1 className="text-4xl font-bold text-indigo-800 mb-4 text-center">StockTickerNews</h1>
        <p className="mb-8 text-gray-700 text-center">
          Welcome to StockTickerNews! Get monthly summaries of recent events for companies on your watch list delivered to your email. Select up to 5 companies from NYSE and NASDAQ. Expansion to other exchanges and premium features coming soon.
        </p>
        <div className="flex justify-center">
          <a
            href="/form"
            className="inline-block px-8 py-3 rounded-md bg-indigo-600 text-white text-lg font-semibold hover:bg-indigo-700 transition"
          >
            Get Started
          </a>
        </div>
      </div>
    </main>
  );
}
