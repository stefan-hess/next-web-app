"use client";

import DemoDashboard from "components/sections/DemoDashboard";
import Footer from "components/sections/Footer";
import Header from "components/sections/Header";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <DemoDashboard />
      <Footer />
    </div>
  );
}
