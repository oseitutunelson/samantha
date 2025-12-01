import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Hero from "./components/Hero";
import About from "./components/About";
import Navbar from "./components/Navbar";
import Features from "./components/Features";
import Story from "./components/Story";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import BettingDashboard from "./components/BettingDashboard";
import Whitepaper from "./components/Whitepaper";

const HomePage = () => {
  const navigate = useNavigate();

  const handleLaunchDapp = () => {
    navigate('/betting');
  };

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

const App = () => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleBackFromWhitepaper = () => {
    navigate('/');
  };

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/betting" element={<BettingDashboard onBackToHome={handleBackToHome} />} />
      <Route path="/whitepaper" element={<Whitepaper onBack={handleBackFromWhitepaper} />} />
    </Routes>
  );
};

export default App;
