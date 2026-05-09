import React from 'react';
import { ArrowDown } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="min-h-[90vh] flex flex-col justify-center pt-16">
      <div className="lux-container">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <span className="lux-label mb-6 block">Curated for the intentional</span>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.08] tracking-tight mb-8">
            Less noise,{' '}
            <span className="text-primary">more substance.</span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mb-12">
            Lux is a carefully crafted space where quality meets simplicity. 
            We believe in fewer things, done better -- designed to serve those 
            who value intention over excess.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <a
              href="#waitlist"
              className="inline-flex items-center justify-center h-12 px-8 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity duration-200"
            >
              Join the waitlist
            </a>
            <a
              href="#about"
              className="inline-flex items-center justify-center h-12 px-8 border border-border text-foreground text-sm font-medium rounded-md hover:bg-secondary transition-colors duration-200"
            >
              Learn more
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="mt-20 md:mt-28">
          <a
            href="#about"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 uppercase tracking-widest"
          >
            Scroll
            <ArrowDown size={14} className="animate-bounce" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
