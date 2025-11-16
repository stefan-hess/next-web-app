"use client";
// import { Metadata } from "next";
// import AboutUs from "components/sections/AboutUs";
import ContactUs from "components/sections/ContactUs";
import DemoDashboard from "components/sections/DemoDashboard";
import FeaturesSection from "components/sections/FeaturesSection";
import Footer from "components/sections/Footer";
import Header from "components/sections/Header";
import Hero from "components/sections/HeroSection";
import Pricing from "components/sections/Pricing";
// import ProductDemo from "components/sections/ProductDemonstration";


export default function Home() {


  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
  <Header />
  <Hero />
    <DemoDashboard />
    <FeaturesSection />
    <Pricing />
    <ContactUs />
    <Footer />
    <a
      href="/feedback"
      className="fixed bottom-6 right-6 z-50 px-6 py-3 bg-[#fdf6ee] text-black font-normal rounded-full shadow-lg border border-black hover:bg-[#8993cb] transition-all duration-200"
      style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.12)' }}
    >
      Give Us Feedback
    </a>
    </div>
  )
}
