import Image from "next/image";
import React from "react";

const demoProducts = [
	{
		title: "Apple (AAPL)",
		description: "In the past month, Apple Inc. has been making headlines with key developments in the AI space and strategic moves. Gene Munster, managing partner at Deepwater Asset Management, highlighted the potential for Apple to boost its AI growth with the introduction of its AI-powered search tool, World Knowledge Answers, integrated into Siri by 2026. This development could impact business dynamics like revenue streams and partnerships with Google...",
      date: "2025-08",
		image: "/assets/AAPL_fundamentals.png",
	},
	{
		title: "Archer Daniels Midland (ADM)",
		description: "President Trump has called on China to increase its soybean orders from the U.S., potentially addressing the trade imbalance between the two countries. This move could impact the U.S. agriculture sector positively, particularly soybean producers like ADM. However, there are doubts about China's willingness to quadruple its soybean purchases from the U.S. as suggested. The agriculture sector is facing challenges from weather-related issues impacting crop production, along with trade tensions between the U.S. and China that have hampered agricultural exports. Despite these uncertainties, companies like ADM, Deere & Co, and Bunge Global SA, which are involved in U.S. soybean production, have seen stock price gains this year.",
		image: "/assets/ADM_fundamentals.png",
	},
	{
		title: "Exxon Mobil (XOM)",
		description: "The company's focus on strategic investments paid off, leading to a substantial return for investors. Additionally, Exxon has made moves to reenter the Sakhalin energy project in Russia, engaging in talks with Rosneft. On the operational front, Exxon has initiated production in the Yellowtail development in Guyana, further boosting its production capacity. Looking ahead, Exxon has outlined an ambitious plan to boost earnings and cash flow by significant margins by 2030, including substantial investments in both oil and gas operations and lower-carbon opportunities like hydrogen and carbon capture.",
		image: "/assets/XOM_fundamentals.png",
	},
	{
		title: "Amazon (AMZN)",
		description: "The Motley Fool recently featured Amazon's (AMZN) pivotal role in shaping AI, cloud services, and space innovations, with bullish analyst ratings and strong financials making it a compelling stock to consider. Rivian Automotive (RIVN) aims to scale production in the EV market, backed by Amazon and Volkswagen, facing challenges but holding significant potential. Additionally, Amazon is set to launch Quick Suite, an AI-powered workspace software, positioning itself in the AI-driven automation market against competitors like Google and Microsoft. Meanwhile, Alphabet is exploring the sale of its AI chips, impacting the tech market alongside Nvidia and Amazon. These developments highlight the evolving landscape of tech and AI within the stock market.",
		image: "/assets/AMZN_fundamentals.png",
	},
];

const ProductDemonstration = () => {
	return (
		<section id="productDemo" className="relative py-20 bg-[#fdf6ee] overflow-hidden">
			{/* Center background blob */}
			<div className="pointer-events-none absolute left-1/2 top-[200px] -translate-x-1/2 -translate-y-0 z-0 w-[600px] h-[180px] rounded-full bg-gradient-to-tr from-indigo-200 via-indigo-300 to-pink-200 opacity-40 blur-3xl animate-blobPulse" />
			<div className="container mx-auto px-4 lg:px-8 relative z-10">
				<h2 className="text-3xl lg:text-5xl font-bold text-black text-center mb-12">Product Snapshot</h2>
				<div className="flex items-center justify-center py-8">
					<div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-black/10 p-6 flex flex-col items-center">
						<video
							src="/assets/product-demo.mov"
							controls
							width={800}
							height={450}
							className="w-full object-contain rounded-lg"
							style={{ objectFit: 'contain' }}
						>
							Your browser does not support the video tag.
						</video>
					</div>
				</div>
			</div>
		</section>
	);
};

export default ProductDemonstration;
