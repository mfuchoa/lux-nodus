import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, HelpCircle, Loader2, ArrowRight, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ClusterStatus = 'gap' | 'emerging' | 'covered';

interface DbCluster {
  id: string;
  name: string;
  label: string | null;
  description: string;
  status: ClusterStatus | null;
  signal_count: number;
  validated_count: number | null;
  has_gap: boolean;
  gap_description: string;
  category: string;
}

interface DbSignal {
  id: string;
  situation: string;
  outcome: string | null;
}

interface ClusterWithSignals extends DbCluster {
  signals: DbSignal[];
  gapRatio: number;
}

/* ------------------------------------------------------------------ */
/*  Status config                                                      */
/* ------------------------------------------------------------------ */

const statusConfig: Record<ClusterStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  gap: {
    label: 'Gap',
    color: 'text-primary',
    bg: 'bg-primary/[0.04]',
    border: 'border-primary/40',
    icon: <AlertTriangle size={14} className="text-primary" />,
  },
  emerging: {
    label: 'Emerging',
    color: 'text-warm-gray',
    bg: 'bg-muted/60',
    border: 'border-border',
    icon: <HelpCircle size={14} className="text-warm-gray" />,
  },
  covered: {
    label: 'Covered',
    color: 'text-accent',
    bg: 'bg-accent/[0.04]',
    border: 'border-accent/20',
    icon: <CheckCircle2 size={14} className="text-accent" />,
  },
};

const STATUS_ORDER: Record<string, number> = { gap: 0, emerging: 1, covered: 2 };

/* ------------------------------------------------------------------ */
/*  Context tags per cluster (keyed by lowercase label/name match)     */
/* ------------------------------------------------------------------ */

const CONTEXT_TAGS: Record<string, string[]> = {
  'difficulty falling asleep after screens go off': [
    'ADHD · sleep onset',
    'ASD · arousal regulation',
    'SPD · wind-down',
  ],
};

/* ------------------------------------------------------------------ */
/*  Deterministic avatar palette                                       */
/* ------------------------------------------------------------------ */

const AVATAR_COLORS = [
  'bg-primary/20 text-primary',
  'bg-accent/20 text-accent',
  'bg-[hsl(var(--warm-gray))]/20 text-[hsl(var(--warm-gray))]',
  'bg-primary/15 text-primary',
  'bg-accent/15 text-accent',
];

const AvatarStack: React.FC<{ count: number }> = ({ count }) => {
  const shown = Math.min(count, 4);
  const extra = count - shown;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {Array.from({ length: shown }).map((_, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded-full border-2 border-card flex items-center justify-center text-[9px] font-semibold ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
          >
            <Users size={10} />
          </div>
        ))}
        {extra > 0 && (
          <div className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[9px] font-semibold text-muted-foreground">
            +{extra}
          </div>
        )}
      </div>
      <span className="ml-2 text-xs text-muted-foreground">
        {count} voice{count !== 1 ? 's' : ''}
      </span>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

const GapBar: React.FC<{ ratio: number }> = ({ ratio }) => (
  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
    <div
      className="h-full rounded-full transition-all duration-500"
      style={{
        width: `${ratio * 100}%`,
        backgroundColor: ratio > 0.6 ? 'hsl(var(--terracotta))' : ratio > 0.3 ? 'hsl(var(--warm-gray))' : 'hsl(var(--moss))',
      }}
    />
  </div>
);

const ClusterCard: React.FC<{ cluster: ClusterWithSignals }> = ({ cluster }) => {
  const [open, setOpen] = useState(false);
  const status: ClusterStatus = cluster.status ?? 'gap';
  const cfg = statusConfig[status];
  const isGap = status === 'gap';

  const clusterLabel = (cluster.label || cluster.name || '').trim();
  const tags = CONTEXT_TAGS[clusterLabel.toLowerCase()] ?? [];

  return (
    <div
      className={`rounded-lg border-[1.5px] transition-all duration-200 ${
        isGap ? 'border-primary/50 bg-primary/[0.03]' : `${cfg.border} ${cfg.bg}`
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 px-4 py-4 text-left"
      >
        <span className="mt-0.5 shrink-0">
          {open
            ? <ChevronDown size={16} className="text-muted-foreground" />
            : <ChevronRight size={16} className="text-muted-foreground" />
          }
        </span>
        <div className="flex-1 min-w-0">
          {/* Needs-answers dot + label for gap clusters */}
          {isGap && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                Needs answers
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-sans text-sm font-semibold text-foreground leading-snug">
              {clusterLabel}
            </h3>
            <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
              {cfg.icon}
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {cluster.description || cluster.gap_description}
          </p>

          {/* Progress bar row */}
          <div className="flex items-center gap-4 mt-2.5">
            <span className="text-xs text-muted-foreground">
              {cluster.signal_count} signal{cluster.signal_count !== 1 ? 's' : ''}
            </span>
            <div className="flex-1 max-w-[140px]">
              <GapBar ratio={cluster.gapRatio} />
            </div>
            <span className="text-xs text-muted-foreground">
              {Math.round(cluster.gapRatio * 100)}% unknown
            </span>
          </div>

          {/* Gap callout */}
          {isGap && (
            <div className="mt-4 rounded-md border border-primary/20 bg-primary/[0.04] px-4 py-3">
              <p className="text-xs text-foreground/80 leading-relaxed">
                {cluster.signal_count} people say the same thing every night. If you have found something that helps, your signal could change this for everyone that comes after you.
              </p>
              <Link
                to="/signals"
                className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Share what worked
                <ArrowRight size={12} />
              </Link>
            </div>
          )}

          {/* Context tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted/80 text-[10px] font-medium text-muted-foreground tracking-wide"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </button>

      {/* Expanded signals */}
      {open && (
        <div className="border-t border-border/50 px-4 py-3 space-y-2 animate-fade-up">
          {cluster.signals.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No signals yet for this cluster.</p>
          ) : (
            cluster.signals.map((sig) => (
              <div key={sig.id} className="flex gap-3 text-xs">
                <span className="shrink-0 mt-0.5 w-1 h-1 rounded-full bg-muted-foreground/40" />
                <div>
                  <span className="text-foreground font-medium">{sig.situation}</span>
                  {sig.outcome && <span className="text-muted-foreground"> &mdash; {sig.outcome}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Card footer — avatar stack */}
      <div className="px-4 pb-3 pt-1">
        <AvatarStack count={cluster.signal_count || 1} />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const GapMap: React.FC = () => {
  const [clusters, setClusters] = useState<ClusterWithSignals[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const { data: clusterRows, error: clusterErr } = await supabase
        .from('clusters')
        .select('*');

      if (clusterErr) {
        setError(clusterErr.message);
        setLoading(false);
        return;
      }

      const { data: signalRows, error: signalErr } = await supabase
        .from('signals')
        .select('id, situation, outcome, cluster_id');

      if (signalErr) {
        setError(signalErr.message);
        setLoading(false);
        return;
      }

      const signalsByCluster: Record<string, DbSignal[]> = {};
      for (const s of signalRows ?? []) {
        const cid = s.cluster_id;
        if (!cid) continue;
        if (!signalsByCluster[cid]) signalsByCluster[cid] = [];
        signalsByCluster[cid].push({ id: s.id, situation: s.situation, outcome: s.outcome });
      }

      const merged: ClusterWithSignals[] = (clusterRows ?? []).map((c: DbCluster) => {
        const total = c.signal_count || 0;
        const validated = c.validated_count ?? 0;
        const gapRatio = total > 0 ? Math.max(0, Math.min(1, 1 - validated / total)) : (c.has_gap ? 0.9 : 0.5);

        return {
          ...c,
          signals: signalsByCluster[c.id] ?? [],
          gapRatio,
        };
      });

      merged.sort((a, b) => {
        const sa = STATUS_ORDER[a.status ?? 'gap'] ?? 0;
        const sb = STATUS_ORDER[b.status ?? 'gap'] ?? 0;
        return sa - sb;
      });

      setClusters(merged);
      setLoading(false);
    };

    fetchData();
  }, []);

  const gapCount = clusters.filter((c) => (c.status ?? 'gap') === 'gap').length;
  const emergingCount = clusters.filter((c) => c.status === 'emerging').length;
  const coveredCount = clusters.filter((c) => c.status === 'covered').length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="lux-container max-w-3xl">
          {/* Header */}
          <div className="mb-10">
            <span className="lux-label">Gap map</span>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold mt-2 text-coffee leading-tight">
              Community knowledge landscape
            </h1>
            <p className="mt-3 text-muted-foreground text-sm leading-relaxed max-w-lg">
              A living map of what this community knows and where answers are still missing.
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-5 mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
              <AlertTriangle size={12} />
              {gapCount} gap{gapCount !== 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warm-gray">
              <HelpCircle size={12} />
              {emergingCount} emerging
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
              <CheckCircle2 size={12} />
              {coveredCount} covered
            </span>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
              Failed to load clusters: {error}
            </div>
          ) : clusters.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No clusters yet.</p>
          ) : (
            <div className="space-y-3">
              {clusters.map((cluster) => (
                <ClusterCard key={cluster.id} cluster={cluster} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom CTA strip */}
      <div className="bg-accent text-accent-foreground">
        <div className="lux-container max-w-3xl py-10 md:py-12 flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-8">
          <div className="flex-1 min-w-0">
            <p className="text-sm md:text-base font-medium leading-relaxed">
              Do you recognize one of these problems? Share what you have tried. Your experience belongs on this map.
            </p>
          </div>
          <Link
            to="/signals"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-accent-foreground/15 border border-accent-foreground/20 text-accent-foreground text-sm font-semibold hover:bg-accent-foreground/25 transition-colors"
          >
            Share a signal
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GapMap;