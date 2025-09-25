"use client"
import React from "react";
import { Button } from "components/ui/Button/Button_new";
import { Card, CardContent, CardHeader } from "components/ui/card";
import { Check, Star } from "lucide-react";

const plans = [
  {
    name: "Munger Tier",
    price: 4.99,
    description: "Perfect for individual investors getting started",
    features: [
      "Monthly fundamental reports for 10 stocks",
      "Business developments of the month",
      "Latest SEC filings for quarterly and annual financial data",
      "Insider trading activities"
    ],
    popular: false
  },
  {
    name: "Buffett Tier",
    price: 8.99,
    description: "Ideal for investors managing their portfolios",
    features: [
      "Monthly fundamental reports for 20 stocks",
      "Business developments of the month",
      "Latest SEC filings for quarterly and annual financial data",
      "Insider trading activities"
    ],
    popular: true
  },
  {
    name: "Graham Tier (Enterprise)",
    price: 99,
    description: "Best for analysts, small research teams, investors with a large number of stocks",
    features: [
      "Unlimited stock reports",
      "Business developments of the month",
      "Latest SEC filings for quarterly and annual financial data",
      "Insider trading alerts",
      "Custom reports"
    ],
    popular: false
  }
];

const PricingSection = () => {
  // --- Blob follower logic ---
  const [hoveredCard, setHoveredCard] = React.useState<number|null>(null);
  const cardRefs = React.useRef<(HTMLDivElement|null)[]>([]);

  function BlobFollower() {
    const [style, setStyle] = React.useState({
      display: 'none',
      opacity: 1,
      left: 0,
      top: 0,
      width: 80,
      height: 80,
      transition: 'all 0.9s cubic-bezier(.4,2,.6,1), opacity 1s',
      position: 'absolute' as const,
      zIndex: 0,
      pointerEvents: 'none' as const,
    });
    const fadeTimeout = React.useRef<NodeJS.Timeout|null>(null);
    React.useEffect(() => {
      if (hoveredCard !== null && cardRefs.current[hoveredCard]) {
        if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
        const card = cardRefs.current[hoveredCard];
        const rect = card!.getBoundingClientRect();
        const parentRect = card!.parentElement!.getBoundingClientRect();
        setStyle(s => ({
          ...s,
          display: 'block',
          opacity: 0.3,
          left: rect.left - parentRect.left - 32,
          top: rect.top - parentRect.top - 32,
        }));
      } else {
        setStyle(s => ({ ...s, opacity: 0 }));
        fadeTimeout.current = setTimeout(() => {
          setStyle(s => ({ ...s, display: 'none' }));
        }, 500);
      }
      return () => {
        if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
      };
    }, [hoveredCard]);
    return (
      <div style={style}>
        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 via-blue-300 to-green-300 opacity-80 blur-md animate-[blob1_18s_ease-in-out_infinite] transition-all duration-300" />
      </div>
    );
  }

  // Expanded card state
  const [expandedIndex, setExpandedIndex] = React.useState<number|null>(null);
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [formError, setFormError] = React.useState<string|null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);

  const handleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
    setFormError(null);
    setAgreedToTerms(false);
  };

  // Map plan name to Stripe priceId
  const priceIdMap: Record<string, string> = {
    "Munger Tier": "price_1S58CGI8pTUJRz6FyikGu4R7",
    "Buffett Tier": "price_1S58CtI8pTUJRz6FSh35gDnU",
    "Graham Tier (Enterprise)": "price_graham" // TODO: Replace with real price IDs
  };

  const handleSubmit = async (e: React.FormEvent, planName: string) => {
    e.preventDefault();
    setFormError(null);
    if (!firstName || !lastName || !email) {
      setFormError("All fields are required.");
      return;
    }
    if (!agreedToTerms) {
      setFormError("You must agree to the Terms & Conditions to submit.");
      return;
    }
    setIsLoading(true);
    try {
      const priceId = priceIdMap[planName];
      if (!priceId) {
        setFormError("Invalid plan selected.");
        setIsLoading(false);
        return;
      }
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          email,
          firstName,
          lastName,
          plan: planName
        })
      });
  const data = await res.json() as { id?: string; error?: string };
      if (!res.ok || !data || typeof data !== 'object' || !('id' in data) || !data.id) {
        setFormError((data && typeof data === 'object' && 'error' in data && data.error) || "Failed to create checkout session.");
        setIsLoading(false);
        return;
      }
      // Load Stripe.js and redirect
      const stripeJs = await import("@stripe/stripe-js");
      const stripe = await stripeJs.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      if (!stripe) {
        setFormError("Stripe.js failed to load.");
        setIsLoading(false);
        return;
      }
      await stripe.redirectToCheckout({ sessionId: data.id });
    } catch (err: any) {
      setFormError(err.message || "An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <section id="pricing" className="relative py-20 lg:py-32 bg-[#fdf6ee]">
      {/* Right-side animated blue/green blob */}
      <div className="pointer-events-none absolute right-[-120px] top-1/2 -translate-y-1/2 w-[320px] h-[320px] z-0 hidden lg:block">
        <div className="w-full h-full rounded-full bg-gradient-to-bl from-green-400 via-blue-300 to-blue-400 opacity-60 blur-3xl animate-[blob2_22s_ease-in-out_infinite]" />
      </div>
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="text-center space-y-4 mb-16">
          <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold text-base mb-2 shadow">
            🎉 Limited Offer: <span className="font-bold">50% OFF</span> on all plans!
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground">
            Choose Your Investment Plan
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Start with our free trial and upgrade to unlock more stocks and advanced features. 
            Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto relative" style={{zIndex:1}}>
          {/* Shared moving blob */}
          <BlobFollower />
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              ref={el => { cardRefs.current[index] = el; }}
              className={`group relative bg-gradient-card border-border transition-all duration-300 hover:shadow-glow hover:-translate-y-2 hover:scale-105 ${
                plan.popular ? 'shadow-glow scale-105' : ''
              } ${expandedIndex === index ? 'ring-2 ring-blue-500' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center space-y-4 pb-8">
                <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-muted-foreground">{plan.description}</p>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-foreground">
                    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.25em' }}>
                      {plan.name === "Munger Tier" && (
                        <>
                          <div className="text-xs line-through mb-1">$9.99</div>
                          $<span className="text-black">{plan.price}</span>
                        </>
                      )}
                      {plan.name === "Buffett Tier" && (
                        <>
                          <div className="text-xs line-through mb-1">$17.99</div>
                          $<span className="text-black">{plan.price}</span>
                        </>
                      )}
                      {plan.name !== "Munger Tier" && plan.name !== "Buffett Tier" && (
                        <>
                          {plan.name === "Graham Tier (Enterprise)" && (
                            <div className="text-xs line-through mb-1">$199</div>
                          )}
                          ${plan.price}
                        </>
                      )}
                      <span className="text-lg font-normal text-muted-foreground whitespace-nowrap">/month</span>
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">billed monthly</p>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-financial-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.name === "Graham Tier (Enterprise)" ? (
                  <a
                    href="#contactus"
                    className="w-full block rounded-xl border border-black bg-[#fdf6ee] px-6 py-3 font-semibold text-black text-center shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95"
                  >
                    Get in touch
                  </a>
                ) : (
                  <>
                    <Button 
                      variant={plan.name === "Buffett Tier" || plan.name === "Munger Tier" ? "financial-outline" : "hero"} 
                      className="w-full"
                      size="lg"
                      onClick={() => handleExpand(index)}
                      type="button"
                    >
                      {expandedIndex === index ? "Hide" : "Get Started"}
                    </Button>
                    {expandedIndex === index && (
                      <form onSubmit={e => handleSubmit(e, plan.name)} className="mt-6 space-y-4 bg-[#fdf6ee] rounded-xl p-6 border border-gray-200 shadow">
                        <h4 className="text-lg font-semibold text-center mb-2">Enter your details</h4>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                          <input
                            className="mt-1 block w-full rounded-md border border-black bg-[#fdf6ee] shadow-sm focus:border-black focus:ring-black transition"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                          <input
                            className="mt-1 block w-full rounded-md border border-black bg-[#fdf6ee] shadow-sm focus:border-black focus:ring-black transition"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            className="mt-1 block w-full rounded-md border border-black bg-[#fdf6ee] shadow-sm focus:border-black focus:ring-black transition"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="flex items-center mt-2">
                          <input
                            type="checkbox"
                            id={`terms-${index}`}
                            checked={agreedToTerms}
                            onChange={e => setAgreedToTerms(e.target.checked)}
                            className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            required
                          />
                          <label htmlFor={`terms-${index}`} className="text-sm text-gray-700">
                            I have read and agree to the <a href="/terms" target="_blank" className="text-indigo-600 underline">Terms &amp; Conditions</a>
                          </label>
                        </div>
                        <button type="submit" className="w-full rounded-xl border border-black bg-[#fdf6ee] px-6 py-3 font-semibold text-black shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed" disabled={isLoading || !agreedToTerms}>
                          {isLoading ? <span className="loading loading-spinner"></span> : "Proceed to checkout"}
                        </button>
                        {formError && <div className="alert alert-error mt-2">{formError}</div>}
                      </form>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Need a custom solution? We offer enterprise packages with tailored features.
          </p>
          <div className="text-financial-primary text-lg font-semibold">
            Contact Sales Team at: info@stocktickernews.com
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;