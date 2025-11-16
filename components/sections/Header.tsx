"use client";
import { ChartColumn, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "components/ui/Button/Button_new";



const Header = () => {

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-border bg-[#fdf6ee] sticky top-0 z-50 overflow-hidden">
      <div className="container mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex h-12 sm:h-14 md:h-16 items-center justify-between">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <ChartColumn className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-financial-primary" />
            <span className="text-base sm:text-lg md:text-xl font-bold text-foreground">StockTickerNews</span>
          </div>
          {/* Desktop Nav removed */}
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