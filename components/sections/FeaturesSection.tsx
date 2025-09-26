import { BarChart3, Building2, Clock, Shield, TrendingUp, UserCheck } from "lucide-react";
import { Card, CardContent } from "components/ui/card";

const features = [
  {
    icon: Building2,
    title: "Business Developments",
    description: "Stay informed about acquisitions, partnerships, product launches, and strategic initiatives that impact underlying business thesis.",
    color: "text-financial-secondary"
  },
  {
    icon: BarChart3,
    title: "Fundamental Analysis",
    description: "Comprehensive quarterly and annual financial metrics updated monthly with official data submitted to the SEC.",
    color: "text-financial-primary"
  },
  {
    icon: UserCheck,
    title: "Insider Trading Data",
    description: "Monitor the latest executive transactions to confirm insiders' conviction of the business.",
    color: "text-financial-accent"
  },
  {
    icon: TrendingUp,
    title: "Market Trends",
    description: "Identify disconnections of stock prices and underlying value with our report.",
    color: "text-financial-success"
  },
  {
    icon: Clock,
    title: "Timely Delivery",
    description: "Receive your comprehensive report every month, delivered to your inbox to stay updated.",
    color: "text-financial-primary"
  },
  {
    icon: Shield,
    title: "Trusted Data",
    description: "All data sourced from verified financial publications and regulatory filings for accuracy and reliability.",
    color: "text-financial-secondary"
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-20 lg:py-32 bg-[#fdf6ee] overflow-hidden">
      {/* Animated blue/green blob on the left side */}
      <div className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/3 w-[320px] h-[320px] z-0">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 via-blue-300 to-green-300 opacity-40 blur-3xl animate-[blob1_18s_ease-in-out_infinite]" />
      </div>
      <div className="relative z-10 container mx-auto px-4 lg:px-8">
        <div className="w-full flex flex-col items-center justify-center space-y-4 mb-16">
          <h2 className="w-full text-3xl lg:text-5xl font-bold text-foreground text-center flex flex-col items-center">
            <span>The Essentials You Need to Find Value</span>
          </h2>
          <p className="w-full text-xl text-muted-foreground max-w-3xl text-center">
            Our report combines the most important financial metrics into valuable insights
            that help you make informed investment decisions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="relative overflow-hidden bg-gradient-card border-border hover:shadow-glow hover:-translate-y-1 hover:scale-102 transition-all duration-300 group">
              {/* Animated blobs inside each card */}
              <div className="pointer-events-none absolute -top-10 -left-10 w-32 h-32 z-0">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 via-blue-300 to-green-300 opacity-40 blur-2xl animate-[blob1_18s_ease-in-out_infinite]" />
              </div>
              <div className="pointer-events-none absolute -bottom-10 -right-10 w-32 h-32 z-0">
                <div className="w-full h-full rounded-full bg-gradient-to-bl from-green-400 via-blue-300 to-blue-400 opacity-40 blur-2xl animate-[blob2_22s_ease-in-out_infinite]" />
              </div>
              <CardContent className="relative z-10 p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-background/50 ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-financial-primary transition-colors">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;