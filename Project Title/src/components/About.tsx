import React from 'react';

const About: React.FC = () => {
  return (
    <section id="about" className="lux-section">
      <div className="lux-container">
        <div className="lux-divider mb-16" />

        <div className="grid md:grid-cols-2 gap-12 md:gap-20">
          {/* Left */}
          <div>
            <span className="lux-label mb-4 block">About</span>
            <h2 className="text-3xl sm:text-4xl font-semibold leading-tight">
              Built on trust,{' '}
              <br className="hidden sm:block" />
              designed with care.
            </h2>
          </div>

          {/* Right */}
          <div className="flex flex-col justify-center gap-6">
            <p className="text-muted-foreground leading-relaxed">
              Lux was born from the belief that digital experiences should feel as considered 
              as the physical objects we cherish. Every pixel, every interaction, every word 
              is placed with purpose.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We partner with builders who share our obsession with craft -- people who 
              understand that lasting value comes from patience, not shortcuts. The result 
              is a platform that respects your time and attention.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-16 border-t border-border">
          {[
            { value: '2,400+', label: 'Waitlist members' },
            { value: '12', label: 'Founding partners' },
            { value: '99.9%', label: 'Uptime guarantee' },
            { value: '< 1s', label: 'Response time' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl sm:text-3xl font-serif font-semibold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
