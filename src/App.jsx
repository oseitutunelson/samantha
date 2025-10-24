import React, { useState } from "react";
import Hero from "./components/Hero";
import About from "./components/About";
import Navbar from "./components/Navbar";
import Features from "./components/Features";
import Story from "./components/Story";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import BettingDashboard from "./components/BettingDashboard";

const App = () => {
  const [showBetting, setShowBetting] = useState(false);

  const handleLaunchDapp = () => {
    setShowBetting(true);
  };

  const handleBackToHome = () => {
    setShowBetting(false);
  };

  if (showBetting) {
    return <BettingDashboard onBackToHome={handleBackToHome} />;
  }

  return (
    <main className="relative min-h-screen w-screen overflow-x-hidden">
      <Navbar />
      <Hero onLaunchDapp={handleLaunchDapp} />
      <About />
      <Features />
      <Story />
      <Contact />
      <Footer />
    </main>
  );
};

export default App;
