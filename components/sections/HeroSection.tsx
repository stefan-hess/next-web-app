import { Button } from "components/ui/Button/Button_new";
import { ArrowRight, BarChart3 } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-[#fdf6ee]">
      {/* Animated blue/green blobs */}
      <div className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/3 w-[320px] h-[320px] z-0">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 via-blue-300 to-green-300 opacity-60 blur-3xl animate-[blob1_18s_ease-in-out_infinite]" />
      </div>
      <div className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/3 w-[320px] h-[320px] z-0">
        <div className="w-full h-full rounded-full bg-gradient-to-bl from-green-400 via-blue-300 to-blue-400 opacity-60 blur-3xl animate-[blob2_22s_ease-in-out_infinite]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Section */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Stay updated with
                <span className="relative inline-block">
                  <span className="bg-gradient-primary bg-clip-text text-blue-600">
                    {" "}
                    Fundamental
                  </span>
                  <span className="block h-1 w-3/4 bg-blue-600 rounded-full mt-1 mx-auto"></span>
                </span>{" "}
                Stock Insights
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed">
                Get monthly updates on what has been moving the core of the
                business, not just the stock price. Invest as the likes of Graham, Buffett and Munger.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a href="/form">
                <Button variant="hero" size="lg" className="group">
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </a>
              <a
                href="#productDemo"
                className="transition-transform duration-300 hover:-translate-y-1 hover:scale-102 border-2 border-financial-primary text-financial-primary bg-transparent font-bold py-3 px-8 rounded-lg shadow text-lg flex items-center justify-center"
                style={{ minHeight: '48px' }}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                View Sample Report
              </a>
              <a
                href="/premium-form"
                className="transition-transform duration-300 hover:-translate-y-1 hover:scale-102 border-2 font-bold py-3 px-8 rounded-lg shadow text-lg flex items-center justify-center"
                style={{ borderColor: '#bfa76a', color: '#bfa76a', background: 'transparent', minHeight: '48px' }}
              >
                Go to Premium
              </a>
            </div>

            <div className="flex items-center space-x-8 text-sm text-muted-foreground"></div>
          </div>

          {/* Image Section – full left edge to center */}
          <div className="relative flex lg:block">
            {/* Right-side animated blob */}
            <div className="pointer-events-none absolute right-[-80px] top-[-60px] h-[500px] w-[220px] z-0 hidden lg:block">
              <div className="w-full h-full rounded-full bg-gradient-to-bl from-red-400 via-blue-300 to-blue-400 opacity-60 blur-3xl animate-[blob2_22s_ease-in-out_infinite]" />
            </div>
            <div className="relative z-10 h-[420px] w-screen lg:w-[50vw] overflow-hidden rounded-none">
              <img
                src="/assets/Hero_image.jpg"
                alt="Financial dashboard showing stock charts and market data"
                className="absolute left-0 top-0 h-full w-full object-cover shadow-card"
                style={{ objectPosition: "left center" }}
              />
            </div>
            <div className="absolute -inset-4 bg-gradient-primary opacity-20 blur-3xl rounded-full pointer-events-none"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;