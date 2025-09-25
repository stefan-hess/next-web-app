import React from "react";

const AboutUs = () => (
	<section id = "aboutUs" className="relative py-20 bg-[#fdf6ee] overflow-hidden">
		{/* Decorative blob on center left */}
		<div className="pointer-events-none absolute left-[-120px] top-1/2 -translate-y-1/2 w-[340px] h-[340px] z-0">
			<div className="w-full h-full rounded-full bg-gradient-to-br from-blue-200 via-indigo-200 to-pink-200 opacity-40 blur-3xl animate-blobPulse" />
		</div>
		<div className="container mx-auto px-4 lg:px-8 max-w-3xl relative z-10">
			<h2 className="text-3xl lg:text-5xl font-bold text-black text-center mb-8">About Us</h2>
			<p className="text-lg text-muted-foreground leading-relaxed mb-6">
				We created this product because we found it incredibly time-consuming to aggregate relevant financial information for each company on our watchlist or in our portfolio. Despite spending countless hours researching, we often lacked a clear sense of where a company was heading strategically or financially.
			</p>
			<p className="text-lg text-muted-foreground leading-relaxed mb-6">
				With this platform, you can quickly grasp the health of a company at a glance. Our goal is to provide you with a sound, data-driven basis to make confident investment and divestment decisions — and keeping a cool head when markets are volatile.
			</p>
		</div>
		<style>{`
			@keyframes blobPulse {
				0%, 100% { transform: scale(1); }
				50% { transform: scale(1.12); }
			}
			.animate-blobPulse {
				animation: blobPulse 14s ease-in-out infinite;
			}
		`}</style>
	</section>
);

export default AboutUs;
