import { Metadata } from "next";
import Header from "components/sections/Header";
import Hero from "components/sections/HeroSection";
import FeaturesSection from "components/sections/FeaturesSection";
import Pricing from "components/sections/Pricing";
import ProductDemo from "components/sections/ProductDemonstration";
import Footer from "components/sections/Footer";
import AboutUs from "components/sections/AboutUs";
import ContactUs from "components/sections/ContactUs";

export const metadata: Metadata = {
  title: "Stock-Ticker-News",
};

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
    <div className="min-h-screen bg-background">
    <Header />
    <Hero />
    <FeaturesSection />
    <Pricing />
    <ProductDemo />
    <AboutUs />
    <ContactUs />
    <Footer />
    <a
      href="/feedback"
      className="fixed bottom-6 right-6 z-50 px-6 py-3 bg-[#fdf6ee] text-black font-normal rounded-full shadow-lg border border-black hover:bg-[#8993cb] transition-all duration-200"
      style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.12)' }}
    >
      Give Us Feedback
    </a>
    </div>
  )
}
