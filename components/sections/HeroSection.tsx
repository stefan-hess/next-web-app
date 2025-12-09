"use client"

import { BarChart, ShieldCheck, Users } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

function CredibilityBar() {
  const items = [
    { icon: <Users className="h-5 w-5" />, text: "Built for professionals" },
    { icon: <ShieldCheck className="h-5 w-5" />, text: "Data from SEC & Verified Sources" },
    { icon: <BarChart className="h-5 w-5" />, text: "Daily updated data" },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 mt-10 text-gray-600">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          {item.icon}
          <span className="text-sm">{item.text}</span>
        </div>
      ))}
    </div>
  );
}

const HeroSection = () => {
  // Parallax refs
  const starRef = useRef<HTMLDivElement>(null);
  const springRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY;
      if (starRef.current) {
        starRef.current.style.transform = `translateY(${scrollY * 0.2}px)`;
      }
      if (springRef.current) {
        springRef.current.style.transform = `translateY(${scrollY * 0.1}px)`;
      }
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <section className="relative overflow-hidden bg-[#fdf6ee]">
      {/* Parallax images */}
          <div
            ref={starRef}
            className="pointer-events-none absolute top-10 z-0 w-[180px] h-[180px] opacity-60 sm:w-[220px] sm:h-[220px] md:w-[280px] md:h-[280px] md:opacity-100 left-0 right-0 mx-auto"
          >
            <Image src="/assets/star.png" alt="Star" width={280} height={280} style={{ objectFit: 'contain' }} />
          </div>
      {/* Animated blue/green blobs */}
      <div className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/3 w-[320px] h-[320px] z-0">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 via-blue-300 to-green-300 opacity-60 blur-3xl animate-[blob1_18s_ease-in-out_infinite]" />
      </div>
      <div className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/3 w-[320px] h-[320px] z-0">
        <div className="w-full h-full rounded-full bg-gradient-to-bl from-green-400 via-blue-300 to-blue-400 opacity-60 blur-3xl animate-[blob2_22s_ease-in-out_infinite]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-2 items-center">
          {/* Text Section */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                See Through the Noise, {" "}
                <span className="relative inline-block">
                  <span className="bg-gradient-primary bg-clip-text text-blue-800">
                    {" "}
                    Find Value.
                  </span>
                  <span className="block h-1 w-3/4 bg-blue-800 rounded-full mt-1 mx-auto"></span>
                </span>{" "}
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed">
                The essential yet affordable suite of fundamental data for NYSE and NASDAQ <br /> listed stocks.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-auto flex items-center gap-2">
                <a
                  href="#productDemo"
                  className="transition-transform duration-300 hover:-translate-y-1 hover:scale-102 border-2 font-bold py-3 px-6 sm:px-8 rounded-lg shadow text-base sm:text-lg flex items-center justify-center"
                  style={{ borderColor: '#bfa76a', color: '#bfa76a', background: 'transparent', minHeight: '48px' }}
                >
                  Go to Demo
                </a>
              </div>
            </div>
            <CredibilityBar />
            <div className="flex items-center space-x-8 text-sm text-muted-foreground"></div>
          </div>

          {/* Image Section – full left edge to center */}
          <div className="relative flex lg:block w-full justify-center">
            {/* Right-side animated blob */}
            <div className="pointer-events-none absolute right-[-80px] top-[-60px] h-[500px] w-[220px] z-0 hidden lg:block">
              <div className="w-full h-full rounded-full bg-gradient-to-bl from-red-400 via-blue-300 to-blue-400 opacity-60 blur-3xl animate-[blob2_22s_ease-in-out_infinite]" />
            </div>
            <div className="relative z-10 h-auto w-full max-w-2xl md:max-w-4xl lg:max-w-7xl xl:max-w-screen-xl mx-auto rounded-xl bg-white shadow-card flex items-center justify-center">
              <Image
                src="/assets/Dashboard_1.png"
                alt="Financial dashboard showing stock charts and market data"
                width={1600}
                height={900}
                className="rounded-xl object-contain w-full h-auto"
                priority
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