import React, { useEffect, useState, useRef, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { useWallet } from '@solana/wallet-adapter-react';
import { supabase } from '@/lib/supabase';
import { Loader2, Mic, MicOff, Sparkles, CheckCircle2, HelpCircle, XCircle } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SignalData {
  situation: string;
  description: string;
  outcome: string;
  context: string;
  cluster_id: string;
}

interface ClusterOption {
  id: string;
  label: string | null;
  name: string;
}

interface ReviewResult {
  status: 'accept' | 'question' | 'decline';
  message: string;
}

const EMPTY: SignalData = { situation: '', description: '', outcome: '', context: '', cluster_id: '' };

const textFields: { key: keyof SignalData; label: string; placeholder: string; rows: number }[] = [
  {
    key: 'situation',
    label: 'Situation',
    placeholder: 'What was the setting or scenario?',
    rows: 2,
  },
  {
    key: 'description',
    label: 'Description',
    placeholder: 'What happened — what did you try or observe?',
    rows: 4,
  },
  {
    key: 'outcome',
    label: 'Outcome',
    placeholder: "What worked, what didn't, or what are you still looking for?",
    rows: 3,
  },
  {
    key: 'context',
    label: 'Context',
    placeholder: 'Age, diagnosis, support level, setting — the more specific, the more useful your signal is to someone in a similar situation.',
    rows: 2,
  },
];

/* ------------------------------------------------------------------ */
/*  Voice input hook (Web Speech API)                                  */
/* ------------------------------------------------------------------ */

const useSpeechRecognition = () => {
  const recognitionRef = useRef<any>(null);
  const [activeField, setActiveField] = useState<string | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = useCallback(
    (fieldKey: string, onResult: (text: string) => void) => {
      if (!isSupported) return;

      // Stop any existing session
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
      }

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        setActiveField(null);
      };

      recognition.onerror = () => setActiveField(null);
      recognition.onend = () => setActiveField(null);

      recognitionRef.current = recognition;
      setActiveField(fieldKey);
      recognition.start();
    },
    [isSupported],
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    setActiveField(null);
  }, []);

  return { isSupported, activeField, startListening, stopListening };
};

/* ------------------------------------------------------------------ */
/*  AI Review callout                                                  */
/* ------------------------------------------------------------------ */

const reviewIcons: Record<string, React.ReactNode> = {
  accept: <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />,
  question: <HelpCircle size={16} className="text-primary shrink-0 mt-0.5" />,
  decline: <XCircle size={16} className="text-primary shrink-0 mt-0.5" />,
};

const ReviewCallout: React.FC<{ review: ReviewResult }> = ({ review }) => (
  <div className="rounded-lg border border-primary/25 bg-primary/[0.05] px-4 py-3.5 flex gap-3 animate-fade-up">
    {reviewIcons[review.status]}
    <p className="text-sm text-foreground/85 leading-relaxed">{review.message}</p>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const SignalForm: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [form, setForm] = useState<SignalData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [clusters, setClusters] = useState<ClusterOption[]>([]);

  // AI review state
  const [reviewing, setReviewing] = useState(false);
  const [review, setReview] = useState<ReviewResult | null>(null);

  // Voice
  const { isSupported: voiceSupported, activeField, startListening, stopListening } =
    useSpeechRecognition();

  // Fetch cluster options
  useEffect(() => {
    const fetchClusters = async () => {
      const { data } = await supabase
        .from('clusters')
        .select('id, label, name')
        .order('name');
      if (data) setClusters(data);
    };
    fetchClusters();
  }, []);

  const handleChange = (key: keyof SignalData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear review when user edits after a review
    if (review) setReview(null);
  };

  const handleVoice = (fieldKey: string) => {
    if (activeField === fieldKey) {
      stopListening();
      return;
    }
    startListening(fieldKey, (transcript) => {
      setForm((prev) => {
        const existing = prev[fieldKey as keyof SignalData];
        const separator = existing.trim() ? ' ' : '';
        return { ...prev, [fieldKey]: existing + separator + transcript };
      });
    });
  };

  /* ---- AI Review ---- */
  const handleReview = async () => {
    setReviewing(true);
    setReview(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/review-signal`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          situation: form.situation,
          description: form.description,
          outcome: form.outcome,
          context: form.context,
        }),
      });
      const data: ReviewResult = await res.json();
      setReview(data);
    } catch {
      setReview({ status: 'decline', message: 'Could not reach the reviewer. You can still submit your signal directly.' });
    } finally {
      setReviewing(false);
    }
  };

  const canSubmit = connected && form.situation.trim() && form.description.trim() && !submitting;
  const canReview =
    (form.situation.trim().length > 0 || form.description.trim().length > 0) &&
    !reviewing;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError(null);

    const payload: Record<string, unknown> = {
      situation: form.situation.trim(),
      description: form.description.trim(),
      outcome: form.outcome.trim() || null,
      context: form.context.trim() || null,
      category: 'community',
      wallet_address: publicKey?.toBase58() ?? null,
      cluster_id: form.cluster_id || null,
    };

    const { error } = await supabase.from('signals').insert(payload);

    setSubmitting(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    setSubmitted(true);
    setReview(null);
    setTimeout(() => {
      setSubmitted(false);
      setForm(EMPTY);
    }, 2800);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="lux-container max-w-2xl">
          {/* Header */}
          <div className="mb-10">
            <span className="lux-label">Share a signal</span>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold mt-2 text-coffee leading-tight">
              What worked — or what are you still looking for?
            </h1>
            <p className="mt-3 text-muted-foreground text-sm leading-relaxed max-w-lg">
              Signals help the community map what we know and surface what we don't. Every submission sharpens the picture.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {textFields.map((f) => {
              const isListening = activeField === f.key;

              return (
                <div key={f.key}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label
                      htmlFor={f.key}
                      className="text-sm font-medium text-foreground"
                    >
                      {f.label}
                      {(f.key === 'situation' || f.key === 'description') && (
                        <span className="text-primary ml-1">*</span>
                      )}
                    </label>

                    {/* Voice mic button */}
                    {voiceSupported && (
                      <button
                        type="button"
                        onClick={() => handleVoice(f.key)}
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-all ${
                          isListening
                            ? 'bg-primary/15 text-primary animate-pulse'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                        title={isListening ? 'Listening... click to stop' : 'Speak to fill this field'}
                      >
                        {isListening ? <MicOff size={12} /> : <Mic size={12} />}
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <textarea
                      id={f.key}
                      rows={f.rows}
                      value={form[f.key]}
                      onChange={(e) => handleChange(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className={`w-full rounded-lg border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/40 transition-shadow resize-y ${
                        isListening ? 'border-primary/40 ring-2 ring-primary/20' : 'border-border'
                      }`}
                    />
                    {isListening && (
                      <span className="absolute top-2 right-3 text-[10px] font-medium text-primary animate-pulse">
                        Listening...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Cluster selector */}
            {clusters.length > 0 && (
              <div>
                <label
                  htmlFor="cluster_id"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Cluster
                  <span className="text-muted-foreground font-normal ml-1.5 text-xs">(optional)</span>
                </label>
                <select
                  id="cluster_id"
                  value={form.cluster_id}
                  onChange={(e) => handleChange('cluster_id', e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-shadow"
                >
                  <option value="">— None —</option>
                  {clusters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label || c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* AI Review button */}
            <div>
              <button
                type="button"
                onClick={handleReview}
                disabled={!canReview}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-primary/20 bg-primary/[0.04] text-sm font-medium text-primary hover:bg-primary/[0.08] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {reviewing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                {reviewing ? 'Reviewing...' : 'AI Review'}
              </button>
            </div>

            {/* AI Review callout */}
            {review && <ReviewCallout review={review} />}

            {/* Submit area */}
            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center justify-center gap-2 h-11 px-7 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {submitted ? 'Submitted' : submitting ? 'Saving...' : 'Submit Signal'}
              </button>

              {!connected && form.situation.trim() && form.description.trim() && (
                <span className="text-xs text-muted-foreground">
                  Connect your wallet to submit
                </span>
              )}
            </div>
          </form>

          {/* Error feedback */}
          {submitError && (
            <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary animate-fade-up">
              {submitError}
            </div>
          )}

          {/* Success feedback */}
          {submitted && (
            <div className="mt-6 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent animate-fade-up">
              Signal received. It will appear on the Gap Map once reviewed.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SignalForm;