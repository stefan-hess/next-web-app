"use client";
import Image from "next/image";
import Link from "next/link";
import RequestDemoModal from "components/sections/RequestDemoModal";
import { Button } from "components/ui/Button/Button_new";



const Header = () => {

  return (
    <header className="border-b border-border bg-[#fdf6ee] sticky top-0 z-50 overflow-hidden">
      <div className="container mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex h-12 sm:h-14 md:h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-1 sm:space-x-2 hover:opacity-80 transition-opacity">
            <Image
              src="/assets/icon/icon_v1.svg"
              width={36}
              height={36}
              className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 text-financial-primary"
              alt="Nektaar logo"
            />
            <span className="text-base sm:text-lg md:text-xl font-bold text-foreground">Nektaar</span>
          </Link>
          {/* Desktop Nav removed */}
          {/* Mobile Nav Button */}
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            <RequestDemoModal
              buttonLabel="Demo"
              buttonClassName="transition-transform duration-300 hover:-translate-y-0.5 border-2 font-bold py-1.5 px-4 rounded-lg shadow text-sm flex items-center justify-center"
              buttonStyle={{ borderColor: '#bfa76a', color: '#bfa76a', background: 'transparent' }}
            />
            <a href="#contactus">
              <Button variant="financial" size="sm">
                Contact Us
              </Button>
            </a>
            <a href="/login">
              <Button variant="financial" size="sm">
                Log In
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