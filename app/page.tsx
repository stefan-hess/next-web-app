"use client";
// import { Metadata } from "next";
// import AboutUs from "components/sections/AboutUs";
import ContactUs from "components/sections/ContactUs";
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
    <FeaturesSection />
    <Pricing />
    <ContactUs />
    <Footer />
    </div>
  )
}
