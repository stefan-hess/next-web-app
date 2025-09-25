"use client";
import { useEffect, useRef, useState, RefObject } from "react";
import { Button } from "components/ui/Button/Button_new";
import { TrendingUp, Menu, ChartColumn } from "lucide-react";

const NAV_ITEMS = [
  { id: "features", label: "Features" },
  { id: "pricing", label: "Pricing" },
  { id: "productDemo", label: "Product Snapshot" },
  { id: "aboutUs", label: "About Us" },
];

const Header = () => {

  const [activeSection, setActiveSection] = useState<string>("features");
  const [hovered, setHovered] = useState<string | null>(null);
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
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <a href="/" className="flex items-center space-x-2 group focus:outline-none">
            <ChartColumn className="h-8 w-8 text-financial-primary group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold text-foreground group-hover:text-financial-primary transition-colors">StockTickerNews</span>
          </a>
          {/* No nav or buttons for non-landing pages */}
          {/* No action buttons for non-landing pages */}
        </div>
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