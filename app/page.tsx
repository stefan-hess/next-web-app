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
  const demoNews = [
    {
      ticker: "AAPL",
      headline: "In the past month, Apple Inc. has been making headlines with key developments in the AI space and strategic moves. Gene Munster, managing partner at Deepwater Asset Management, highlighted the potential for Apple to boost its AI growth with the introduction of its AI-powered search tool, World Knowledge Answers, integrated into Siri by 2026. This development could impact business dynamics like revenue streams and partnerships with Google. Despite recent advancements, Apple's stock performance has not been the strongest among the top stocks this year, based on insights from Benzinga Pro. Analysts like Munster and Dan Ives have shared their views on Apple's AI strategy and potential acquisitions, signaling both opportunities and challenges for the tech giant.On the earnings front, some market analysts like Jim Cramer have shown continued interest in Apple despite its recent performance, emphasizing the company's resilience and potential for growth. Recent legal wins and operational improvements have boosted confidence in Apple's outlook, with a positive ruling on its partnership with Google bolstering its position in the market. As Apple gears up for the iPhone 17 launch, industry experts like Daniel Newman have raised concerns about the company's innovation strategy, calling for more disruptive advancements rather than predictable upgrades.Looking ahead, Apple faces high expectations surrounding its upcoming product launches and strategic decisions, particularly in the AI and consumer tech sectors. Despite criticisms and challenges, Apple's stock trends indicate positivity across various time frames, reflecting ongoing investor interest and market momentum. With competition in the AI space intensifying, Apple aims to maintain its position as a leading player in the tech industry while navigating evolving market demands and investor expectations.",
      date: "2025-08",
    },
    {
      ticker: "ADM",
      headline: "Archer-Daniels-Midland Company (ADM) recently reported second-quarter earnings, surpassing analyst expectations for adjusted earnings per share but falling short in terms of quarterly sales. The company's earnings before income taxes for the quarter decreased by 53% compared to the previous year, with a decline in gross profit as well. ADM's adjusted EBITDA and segment operating profits also saw some decreases, reflecting challenges in certain segments such as Ag Services and Oilseeds and Carbohydrate Solutions. Despite this, the company remains positive about its future outlook, noting improved margins expected in the later part of the year. ADM has adjusted its fiscal 2025 earnings guidance and is focused on exiting 2025 with strong momentum. The stock price has responded positively to these developments, trading higher as investors digest the latest financial results and outlook. On another front, President Trump has called on China to increase its soybean orders from the U.S., potentially addressing the trade imbalance between the two countries. This move could impact the U.S. agriculture sector positively, particularly soybean producers like ADM. However, there are doubts about China's willingness to quadruple its soybean purchases from the U.S. as suggested. The agriculture sector is facing challenges from weather-related issues impacting crop production, along with trade tensions between the U.S. and China that have hampered agricultural exports. Despite these uncertainties, companies like ADM, Deere & Co, and Bunge Global SA, which are involved in U.S. soybean production, have seen stock price gains this year. The situation remains fluid as stakeholders wait to see how China's response and trade negotiations unfold in the coming months, affecting the future prospects of soybean producers and related industries.",
      date: "2025-08",
    },
    {
      ticker: "XOM",
      headline: "ExxonMobil, a major player in the oil industry, has seen substantial growth in shareholder value over the past five years, outperforming the market with strategic investments during bear markets. Exxon's stock price has significantly increased despite oil price fluctuations, with recent oil prices hovering above $60 per barrel. The company's focus on strategic investments paid off, leading to a substantial return for investors. Additionally, Exxon has made moves to reenter the Sakhalin energy project in Russia, engaging in talks with Rosneft. On the operational front, Exxon has initiated production in the Yellowtail development in Guyana, further boosting its production capacity. Looking ahead, Exxon has outlined an ambitious plan to boost earnings and cash flow by significant margins by 2030, including substantial investments in both oil and gas operations and lower-carbon opportunities like hydrogen and carbon capture. The company aims to continue increasing dividends and stock buybacks, positioning itself as a more profitable and shareholder-friendly company in the coming years.",
      date: "2025-08",
    },
    {
      ticker: "AMZN",
      headline: "The Motley Fool recently featured Amazon's (AMZN) pivotal role in shaping AI, cloud services, and space innovations, with bullish analyst ratings and strong financials making it a compelling stock to consider. Rivian Automotive (RIVN) aims to scale production in the EV market, backed by Amazon and Volkswagen, facing challenges but holding significant potential. Additionally, Amazon is set to launch Quick Suite, an AI-powered workspace software, positioning itself in the AI-driven automation market against competitors like Google and Microsoft. Meanwhile, Alphabet is exploring the sale of its AI chips, impacting the tech market alongside Nvidia and Amazon. These developments highlight the evolving landscape of tech and AI within the stock market.",
      date: "2025-08",
    },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-br from-blue-50 to-indigo-100 relative w-full">
      <div className="mt-16 w-full max-w-2xl rounded-xl bg-white p-8 shadow-xl">
        <h1 className="mb-4 text-center text-4xl font-bold text-indigo-800">StockTickerNews</h1>
        <p className="mb-8 text-center text-gray-700">
          Welcome to StockTickerNews! Are you a fundamental investor? Get monthly summaries of recent events for companies on your watch list delivered
          to your email and keep up with underlying business developments with ease. Try for free and select 2 companies from NYSE and NASDAQ. Check out our new premium plans below for additional stocks to select!
        </p>
        <div className="flex justify-center mt-8 gap-4">
          <a
            href="/form"
            className="inline-block rounded-md bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-8 py-3 text-lg font-semibold text-white shadow-lg transition hover:scale-105 hover:shadow-2xl active:scale-95"
          >
            Get Started
          </a>
          <a
            href="/checkout"
            className="inline-block rounded-md bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-8 py-3 text-lg font-semibold text-white shadow-lg transition hover:scale-105 hover:shadow-2xl active:scale-95"
          >
            Go Premium
          </a>
        </div>
        <div className="mt-6 rounded-md border border-yellow-400 bg-yellow-50 p-4 text-sm text-yellow-800">
          <strong>Warning:</strong> News summaries are generated with the help of AI and therefore may contain mistakes or inaccuracies, including when there is a lack of available news. Do not base investment decisions solely on this newsletter. Use it as an aid for further research on the stocks. The content is not investment advice and we are not liable for any investment decisions made based on the newsletter. With subscribing to any stock-ticker-news plan you agree with this disclaimer. See our <a href="/terms" className="text-indigo-600 underline">Terms &amp; Conditions</a>.
        </div>
      </div>
      {/* Demo News Carousel */}
      <div className="w-full overflow-x-hidden py-12">
        <div
          className="flex gap-8 animate-marquee"
          style={{
            width: 'max-content',
            animation: 'marquee 40s linear infinite',
          }}
        >
          {demoNews.concat(demoNews).map((news, idx) => (
            <div
              key={idx}
              className="min-w-[600px] max-w-2xl bg-white rounded-xl shadow-lg p-6 border border-indigo-100 flex-shrink-0"
            >
              <div className="text-xs text-gray-400 mb-1">{news.date}</div>
              <div className="font-bold text-indigo-700 mb-2">{news.ticker}</div>
              <div className="text-gray-700 mb-2">{news.headline}</div>
            </div>
          ))}
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    </main>
  )
}
