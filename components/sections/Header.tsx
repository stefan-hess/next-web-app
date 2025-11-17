"use client";
import { ChartColumn } from "lucide-react";
import { Button } from "components/ui/Button/Button_new";



const Header = () => {

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
            {/* Mobile menu navigation button removed */}
          </div>
        </div>
        {/* Mobile Nav Drawer removed */}
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