import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

const Waitlist: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    setStatus('loading');
    setErrorMsg('');

    const { error } = await supabase.from('waitlist').insert({ email: email.trim().toLowerCase() });

    if (error) {
      if (error.code === '23505') {
        setErrorMsg('You are already on the list.');
      } else {
        setErrorMsg('Something went wrong. Please try again.');
      }
      setStatus('error');
      return;
    }

    setStatus('success');
    setEmail('');
  };

  return (
    <section id="waitlist" className="lux-section">
      <div className="lux-container">
        <div className="lux-divider mb-16" />

        <div className="max-w-xl mx-auto text-center">
          <span className="lux-label mb-4 block">Early access</span>
          <h2 className="text-3xl sm:text-4xl font-semibold leading-tight mb-4">
            Join the waitlist.
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-10">
            Be among the first to experience Lux. No spam, no noise -- 
            just a single email when we are ready for you.
          </p>

          {status === 'success' ? (
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-accent/10 text-accent rounded-md text-sm font-medium">
              <Check size={16} />
              You are on the list. We will be in touch.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 h-12 px-4 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="h-12 px-6 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {status === 'loading' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Join
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p className="text-sm text-destructive mt-3">{errorMsg}</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Waitlist;
