import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Values from '@/components/Values';
import Waitlist from '@/components/Waitlist';
import Footer from '@/components/Footer';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Values />
        <Waitlist />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
