import { TrendingUp, ChartColumn } from "lucide-react";

const Footer = () => {
  return (
  <footer className="w-full py-8 border-t border-black/10 bg-[#fdf6ee]">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <ChartColumn className="h-6 w-6 text-financial-primary" />
              <span className="text-lg font-bold text-foreground">StockTickerNews</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed bg-[#fdf6ee]" >
              Empowering the intelligent investor
            </p>
            <div className="flex items-center space-x-4">
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="text-muted-foreground hover:text-financial-primary transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-muted-foreground hover:text-financial-primary transition-colors">Pricing</a></li>
              <li><a href="#productDemo" className="text-muted-foreground hover:text-financial-primary transition-colors">Product Demo</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#aboutUs" className="text-muted-foreground hover:text-financial-primary transition-colors">About Us</a></li>
              <li><a href="#contactus" className="text-muted-foreground hover:text-financial-primary transition-colors">Contact</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/privacy" className="text-muted-foreground hover:text-financial-primary transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="text-muted-foreground hover:text-financial-primary transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground">
            © 2025 StockTickerNews. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;