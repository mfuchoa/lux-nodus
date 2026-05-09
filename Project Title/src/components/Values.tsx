import React from 'react';
import { Shield, Leaf, Eye, Zap } from 'lucide-react';

const values = [
  {
    icon: Shield,
    title: 'Trust first',
    description:
      'Security and transparency are not features -- they are foundations. Your data, your keys, your control.',
  },
  {
    icon: Leaf,
    title: 'Sustainable pace',
    description:
      'We build for longevity, not hype cycles. Every decision considers the next decade, not the next quarter.',
  },
  {
    icon: Eye,
    title: 'Radical clarity',
    description:
      'No dark patterns, no hidden fees, no jargon walls. If we cannot explain it simply, we have not understood it well enough.',
  },
  {
    icon: Zap,
    title: 'Quiet performance',
    description:
      'Speed you feel but never think about. Infrastructure that works so well it becomes invisible.',
  },
];

const Values: React.FC = () => {
  return (
    <section id="values" className="lux-section bg-secondary/50">
      <div className="lux-container">
        <div className="max-w-xl mb-16">
          <span className="lux-label mb-4 block">Our values</span>
          <h2 className="text-3xl sm:text-4xl font-semibold leading-tight">
            Principles that guide every decision.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {values.map((value) => (
            <div
              key={value.title}
              className="p-8 bg-card rounded-md border border-border hover:border-primary/20 transition-colors duration-300"
            >
              <div className="w-10 h-10 rounded-md bg-accent/10 flex items-center justify-center mb-5">
                <value.icon size={20} className="text-accent" />
              </div>
              <h3 className="font-serif text-lg font-semibold mb-3">{value.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Values;
