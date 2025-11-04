

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
