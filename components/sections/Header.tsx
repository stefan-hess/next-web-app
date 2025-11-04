"use client";
import { ChartColumn, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "components/ui/Button/Button_new";

const NAV_ITEMS = [
  { id: "features", label: "Features" },
  { id: "pricing", label: "Pricing" },
  { id: "productDemo", label: "Product Snapshot" },
  { id: "aboutUs", label: "About Us" },
];

const Header = () => {

  const [activeSection, setActiveSection] = useState<string>("features");
  const [hovered, setHovered] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const blobRef = useRef<HTMLDivElement | null>(null);

  // Intersection Observer for scroll tracking
  useEffect(() => {
    const sectionIds = NAV_ITEMS.map(item => item.id);
    const sections = sectionIds.map(id => document.getElementById(id));
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      let mostVisible: string | null = null;
      let maxRatio = 0;
      entries.forEach((entry: IntersectionObserverEntry) => {
        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
          mostVisible = (entry.target as HTMLElement).id;
          maxRatio = entry.intersectionRatio;
        }
      });
      if (mostVisible) setActiveSection(mostVisible);
    };
    const observer = new window.IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: "-40% 0px -40% 0px",
      threshold: [0.2, 0.5, 0.7, 1],
    });
    sections.forEach(sec => sec && observer.observe(sec));
    return () => observer.disconnect();
  }, []);

  // Move blob to hovered or active nav item
  useEffect(() => {
    const key = hovered || activeSection;
    const el = navRefs.current[key];
    const blob = blobRef.current;
    if (el && blob && el.parentElement) {
      const rect = el.getBoundingClientRect();
      const navRect = el.parentElement.getBoundingClientRect();
      blob.style.left = `${rect.left - navRect.left - 16}px`;
      blob.style.width = `${rect.width + 32}px`;
    }
  }, [activeSection, hovered]);

  return (
    <header className="border-b border-border bg-[#fdf6ee] sticky top-0 z-50 overflow-hidden">
      <div className="container mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex h-12 sm:h-14 md:h-16 items-center justify-between">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <ChartColumn className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-financial-primary" />
            <span className="text-base sm:text-lg md:text-xl font-bold text-foreground">StockTickerNews</span>
          </div>
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-8 relative" style={{ position: "relative" }}>
            {/* Animated blob */}
            <div
              ref={blobRef}
              style={{
                position: "absolute",
                top: -4,
                height: 20,
                zIndex: 0,
                transition: "left 0.3s cubic-bezier(.4,1.2,.4,1), width 0.3s cubic-bezier(.4,1.2,.4,1)",
                pointerEvents: "none",
                opacity: 0.8,
              }}
              className="bg-gradient-to-tr from-indigo-200 via-indigo-300 to-pink-200 blur-2xl rounded-full"
            />
            {NAV_ITEMS.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                ref={(el: HTMLAnchorElement | null) => { navRefs.current[item.id] = el; }}
                className={`text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative z-10 ${
                  (hovered === item.id || (!hovered && activeSection === item.id)) ? "font-bold text-financial-primary" : ""
                }`}
                onMouseEnter={() => setHovered(item.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {item.label}
              </a>
            ))}
          </nav>
          {/* Mobile Nav Button */}
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            <a href="/login">
              <Button variant="financial" size="sm">
                Log In
              </Button>
            </a>
            <a href="#contactus">
              <Button variant="financial" size="sm">
                Contact Us
              </Button>
            </a>
            <Button variant="ghost" size="icon" className="md:hidden p-1" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Open navigation menu">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex flex-col">
            <div className="bg-[#fdf6ee] shadow-lg rounded-b-2xl p-4 pt-6 flex flex-col gap-4 w-full max-w-xs mx-auto mt-0">
              {NAV_ITEMS.map(item => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="text-base font-semibold text-financial-primary py-2 px-3 rounded hover:bg-indigo-50 transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <a href="/login" className="text-base font-semibold text-financial-primary py-2 px-3 rounded hover:bg-indigo-50 transition" onClick={() => setMobileMenuOpen(false)}>
                Log In
              </a>
              <a href="#contactus" className="text-base font-semibold text-financial-primary py-2 px-3 rounded hover:bg-indigo-50 transition" onClick={() => setMobileMenuOpen(false)}>
                Contact Us
              </a>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setMobileMenuOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .blur-2xl {
          filter: blur(24px);
        }
      `}</style>
    </header>
  );
};

export default Header;