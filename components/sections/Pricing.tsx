"use client"
import { Check } from "lucide-react";
import React from "react";
import { Button } from "components/ui/Button/Button_new";
import { Card, CardContent, CardHeader } from "components/ui/card";
import { GLOBAL_VARS } from "globalVars";

const plans = [
  {
    name: "Munger",
    price: 49.00,
    description: "Ideal for individual analysts and sophisticated retail investors",
    features: [
      "Coverage of 10 stocks",
      "10 years of historical Balance Sheet, Income Statement, Cash Flow Statement data",
      "Quarterly and Annual official filings of financial reportings data",
      "Historical market cap data",
      "Business developments of the month",
      "Dividend history",
      "Insider trading activities",
      "News Sentiment Analysis",
      "Access to community discussions",
      <span className="font-bold">10 AI queries per day / user</span>,
    ],
    popular: false
  },
  {
    name: "Buffett",
    price: 99.00,
    description: "Best for wealth managers and investment advisors",
    features: [
      "Unlimited coverage of stocks",
      "20 years of historical Balance Sheet, Income Statement, Cash Flow Statement data",
      "Quarterly and Annual official filings of financial reportings data",
      "Historical market cap data",
      "Business developments of the month",
      "Dividend history",
      "Insider trading activities",
      "News Sentiment Analysis",
      "Access to community discussions",
  <span className="font-bold">100 AI queries per day / user</span>,
  <span className="font-bold">Advanced Support</span>,
    ],
    popular: true
  },
  {
    name: "Graham Tier (Enterprise)",
    price: 499,
    description: "Customized solutions for family offices, Hedge Funds, Asset Managers starting at",
    features: [
      "Unlimited stocks coverage",
      "20 years of historical Balance Sheet, Income Statement, Cash Flow Statement data",
      "Quarterly and Annual official filings of financial reportings data",
      "Historical market cap data",
      "Business developments of the month",
      "Dividend history",
      "Insider trading activities",
      "News Sentiment Analysis",
      "Access to community discussions",
  <span className="font-bold">Unlimited AI queries</span>,
  <span className="font-bold">Custom dashboards and KPI</span>,
  <span className="font-bold">Priority Support</span>
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
  const [firstName, _setFirstName] = React.useState("");
  const [lastName, _setLastName] = React.useState("");
  const [email, _setEmail] = React.useState("");
  const [password, _setPassword] = React.useState("");
  const [_formError, _setFormError] = React.useState<string|null>(null);
  const [_isLoading, _setIsLoading] = React.useState(false);
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);

  const handleExpand = (idx: number) => {
  setExpandedIndex(expandedIndex === idx ? null : idx);
  _setFormError(null);
  setAgreedToTerms(false);
  };

  // Map plan name to Stripe priceId (centralized in GLOBAL_VARS)
  const priceIdMap: Record<string, string> = {
    Munger: GLOBAL_VARS.PRICE_ID_MAP.Munger,
    Buffett: GLOBAL_VARS.PRICE_ID_MAP.Buffett,
    Graham: GLOBAL_VARS.PRICE_ID_MAP.Graham
  };

  const handleSubmit = async (e: React.FormEvent, planName: string) => {
    e.preventDefault();
  _setFormError(null);
    if (!firstName || !lastName || !email || !password) {
      _setFormError("All fields are required.");
      return;
    }
    if (!agreedToTerms) {
      _setFormError("You must agree to the Terms & Conditions to submit.");
      return;
    }
    _setIsLoading(true);
    try {
      // 1. Call API route to sign up and create subscription
      const resSignup = await fetch("/api/signup-and-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName
        })
      });
      const signupData = await resSignup.json();
      const signupSuccess = typeof signupData === 'object' && signupData !== null && 'success' in signupData && signupData.success;
      const signupError = typeof signupData === 'object' && signupData !== null && 'error' in signupData ? signupData.error : undefined;
      if (!resSignup.ok || !signupSuccess) {
  _setFormError(typeof signupError === 'string' ? signupError : "Failed to sign up and create subscription.");
  _setIsLoading(false);
        return;
      }
      // 3. Proceed to Stripe checkout
      const priceId = priceIdMap[planName];
      if (!priceId) {
  _setFormError("Invalid plan selected.");
  _setIsLoading(false);
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
          plan: planName,
          planLabel: (planName === 'Munger' ? 'Basic' : (planName === 'Buffett' ? 'Pro' : planName)),
        })
      });
      const data = await res.json() as { id?: string; error?: string };
      if (!res.ok || !data || typeof data !== 'object' || !('id' in data) || !data.id) {
  _setFormError((data && typeof data === 'object' && 'error' in data && data.error) || "Failed to create checkout session.");
  _setIsLoading(false);
        return;
      }
      // Load Stripe.js and redirect
      const stripeJs = await import("@stripe/stripe-js");
      const stripe = await stripeJs.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      if (!stripe) {
  _setFormError("Stripe.js failed to load.");
  _setIsLoading(false);
        return;
      }
      await stripe.redirectToCheckout({ sessionId: data.id });
    } catch (err: unknown) {
      if (err instanceof Error) {
  _setFormError(err.message || "An error occurred. Please try again.");
      } else {
  _setFormError("An error occurred. Please try again.");
      }
  _setIsLoading(false);
    }
  };

  return (
    <section id="pricing" className="relative py-20 lg:py-32 bg-[#fdf6ee]">
      {/* Right-side animated blue/green blob */}
      <div className="pointer-events-none absolute right-[-120px] top-1/2 -translate-y-1/2 w-[320px] h-[320px] z-0 hidden lg:block">
        <div className="w-full h-full rounded-full bg-gradient-to-bl from-green-400 via-blue-300 to-blue-400 opacity-60 blur-3xl animate-[blob2_22s_ease-in-out_infinite]" />
      </div>
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
  <div className="text-center space-y-4 mb-24">
          <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold text-base mb-2 shadow">
            🎉 Limited Offer: <span className="font-bold">50% OFF</span> on all plans!
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground">
            Choose Your Plan
          </h2>
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
                plan.popular ? 'shadow-glow scale-105 border-4 border-blue-500' : ''
              } ${expandedIndex === index ? 'ring-2 ring-blue-500' : ''}`}
            >
                {plan.popular && (
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center space-x-2 shadow-md">
                      {/* Star icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.049 9.393c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.966z"/></svg>
                      <span>Popular</span>
                    </div>
                  </div>
                )}
              
              <CardHeader className="text-center space-y-4 pb-8">
                <h3 className="text-2xl font-bold text-foreground">{plan.name === "Munger" ? "Basic" : (plan.name === "Buffett" ? "Pro" : (plan.name.startsWith("Graham") ? "Enterprise" : plan.name))}</h3>
                <p className="text-muted-foreground">{plan.description}</p>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-foreground">
                    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.25em' }}>
                      {plan.name === "Munger" && (
                        <>
                          <div className="text-xs line-through mb-1">$99</div>
                          $<span className="text-black">{plan.price}</span>
                        </>
                      )}
                      {plan.name === "Buffett" && (
                        <>
                          <div className="text-xs line-through mb-1">$199</div>
                          $<span className="text-black">{plan.price}</span>
                        </>
                      )}
                      {plan.name !== "Munger" && plan.name !== "Buffett" && (
                        <>
                          {plan.name === "Graham" && (
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

                <div className="flex items-end justify-center min-h-[60px] mt-8">
                  {plan.name === "Graham Tier (Enterprise)" ? (
                    <Button
                      asChild
                      variant="financial-outline"
                      className="w-full"
                      size="lg"
                    >
                      <a href="#contactus">Get in touch</a>
                    </Button>
                  ) : (
                    <>
                      {expandedIndex !== index && (
                        <Button 
                          variant={plan.name === "Buffett" || plan.name === "Munger" ? "financial-outline" : "hero"} 
                          className="w-full"
                          size="lg"
                          onClick={() => handleExpand(index)}
                          type="button"
                        >
                          Get Started
                        </Button>
                      )}
                      {expandedIndex === index && (
                        <form onSubmit={e => handleSubmit(e, plan.name)} className="mt-6 space-y-4 bg-[#fdf6ee] rounded-xl p-6 border border-gray-200 shadow">
                          {_formError && (
                            <div className="text-red-600 text-sm font-medium">{_formError}</div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col space-y-2">
                              <label htmlFor={`firstName-${index}`} className="text-xs font-semibold text-muted-foreground">First Name</label>
                              <input
                                id={`firstName-${index}`}
                                type="text"
                                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                value={firstName}
                                onChange={e => _setFirstName(e.target.value)}
                                placeholder="Jane"
                                required
                              />
                            </div>
                            <div className="flex flex-col space-y-2">
                              <label htmlFor={`lastName-${index}`} className="text-xs font-semibold text-muted-foreground">Last Name</label>
                              <input
                                id={`lastName-${index}`}
                                type="text"
                                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                value={lastName}
                                onChange={e => _setLastName(e.target.value)}
                                placeholder="Doe"
                                required
                              />
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <label htmlFor={`email-${index}`} className="text-xs font-semibold text-muted-foreground">Email</label>
                            <input
                              id={`email-${index}`}
                              type="email"
                              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              value={email}
                              onChange={e => _setEmail(e.target.value)}
                              placeholder="you@example.com"
                              required
                            />
                          </div>
                          <div className="flex flex-col space-y-2">
                            <label htmlFor={`password-${index}`} className="text-xs font-semibold text-muted-foreground">Password</label>
                            <input
                              id={`password-${index}`}
                              type="password"
                              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              value={password}
                              onChange={e => _setPassword(e.target.value)}
                              placeholder="••••••••"
                              required
                            />
                          </div>
                          <div className="flex items-start space-x-2">
                            <input
                              id={`terms-${index}`}
                              type="checkbox"
                              checked={agreedToTerms}
                              onChange={e => setAgreedToTerms(e.target.checked)}
                              className="mt-1 h-4 w-4 rounded border-gray-300 focus:ring-blue-500"
                              required
                            />
                            <label htmlFor={`terms-${index}`} className="text-xs text-muted-foreground">
                              I agree to the <a href="/terms" className="underline">Terms & Conditions</a> and <a href="/privacy" className="underline">Privacy Policy</a>.
                            </label>
                          </div>
                          <Button
                            type="submit"
                            variant={plan.name === 'Buffett' || plan.name === 'Munger' ? 'financial-outline' : 'hero'}
                            className="w-full"
                            size="lg"
                            disabled={_isLoading}
                          >
                            {_isLoading ? 'Processing…' : `Continue with ${plan.name === 'Munger' ? 'Basic' : (plan.name === 'Buffett' ? 'Pro' : (plan.name.startsWith('Graham') ? 'Enterprise' : plan.name))}`}
                          </Button>
                        </form>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Monthly subscriptions can be canceled anytime.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;