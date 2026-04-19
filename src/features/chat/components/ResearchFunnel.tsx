import { motion } from 'framer-motion';
import { Database, Filter, Brain, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import type { MetaData } from '@/types';
import { useCountUp } from '@/hooks/useCountUp';
import { formatMs } from '@/lib/utils';

interface Props {
  meta: MetaData;
  insightCount?: number;
}

/* ── Individual animated step ─────────────────────────────────────────────── */
interface StepProps {
  icon: React.ElementType;
  label: string;
  sublabel: string;
  value: number;
  color: { ring: string; text: string; bg: string; icon: string };
  index: number;
  isLast: boolean;
}

function FunnelStep({ icon: Icon, label, sublabel, value, color, index, isLast }: StepProps) {
  const count = useCountUp(value, 800, index * 120);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, type: 'spring', stiffness: 260, damping: 22 }}
        className="flex flex-col items-center gap-2 min-w-[80px]"
      >
        {/* Icon bubble */}
        <div
          className="relative w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: color.bg, border: `1.5px solid ${color.ring}` }}
        >
          <Icon size={18} style={{ color: color.icon }} aria-hidden="true" />
          {/* Step number */}
          <span
            className="absolute -top-2 -right-2 w-4.5 h-4.5 rounded-full text-[9px] font-bold flex items-center justify-center leading-none"
            style={{ background: color.ring, color: '#fff', width: 18, height: 18 }}
            aria-hidden="true"
          >
            {index + 1}
          </span>
        </div>

        {/* Count — animated */}
        <div
          className="text-xl font-semibold tabular-nums tracking-tight leading-none"
          style={{ color: color.text }}
          aria-label={`${label}: ${value}`}
        >
          {count.toLocaleString()}
        </div>

        {/* Labels */}
        <div className="text-center">
          <div className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-none">
            {label}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-none mt-0.5">
            {sublabel}
          </div>
        </div>
      </motion.div>

      {/* Connector */}
      {!isLast && (
        <div className="flex items-center self-start mt-5 flex-shrink-0" aria-hidden="true">
          <div className="h-px w-4 sm:w-7 bg-slate-200 dark:bg-slate-700" />
          <ChevronRight size={12} className="text-slate-300 dark:text-slate-600 -ml-1" />
        </div>
      )}
    </>
  );
}

/* ── Color palette for each step ─────────────────────────────────────────── */
const STEP_COLORS = [
  { ring: '#0D9488', text: '#0F766E', bg: '#F0FDFA', icon: '#0F766E' },  // teal   — retrieved
  { ring: '#4F46E5', text: '#4338CA', bg: '#EEF2FF', icon: '#4338CA' },  // indigo — unique
  { ring: '#D97706', text: '#B45309', bg: '#FFFBEB', icon: '#B45309' },  // amber  — for AI
  { ring: '#059669', text: '#047857', bg: '#ECFDF5', icon: '#047857' },  // emerald— insights
] as const;

// Dark-mode-friendly replacements injected via CSS variables (simplified here)

const STEPS = [
  { key: 'retrieved', label: 'Retrieved',  sublabel: 'from 3 sources', icon: Database     },
  { key: 'dedup',     label: 'Unique',     sublabel: 'after dedup',    icon: Filter       },
  { key: 'llm',       label: 'For AI',     sublabel: 'top ranked',     icon: Brain        },
  { key: 'insights',  label: 'Insights',   sublabel: 'verified',       icon: CheckCircle2 },
] as const;

const SOURCE_CONFIG = {
  PubMed:         { label: 'PubMed',  textClass: 'text-teal-700 dark:text-teal-400',   bgClass: 'bg-teal-50 dark:bg-teal-900/20   border-teal-200 dark:border-teal-800'   },
  OpenAlex:       { label: 'OpenAlex', textClass: 'text-indigo-700 dark:text-indigo-400', bgClass: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' },
  ClinicalTrials: { label: 'CT.gov',  textClass: 'text-amber-700 dark:text-amber-400',  bgClass: 'bg-amber-50 dark:bg-amber-900/20   border-amber-200 dark:border-amber-800'   },
} as const;

/* ── Main component ───────────────────────────────────────────────────────── */
export function ResearchFunnel({ meta, insightCount = 0 }: Props) {
  const values: Record<string, number> = {
    retrieved: meta.totalRetrieved,
    dedup:     meta.afterDeduplication,
    llm:       meta.filteredForLLM,
    insights:  insightCount,
  };

  return (
    <section
      aria-label="Research pipeline summary"
      className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"
            aria-hidden="true"
          />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Research Pipeline
          </h3>
        </div>
        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
          <Clock size={11} aria-hidden="true" />
          <span className="text-xs font-mono">{formatMs(meta.processingTimeMs)}</span>
        </div>
      </div>

      {/* Funnel steps — horizontal scroll on mobile */}
      <menu
        className="flex items-start gap-0 overflow-x-auto no-scrollbar pt-2 pb-1 sm:pb-0 sm:justify-between"
        role="list"
        aria-label="Pipeline steps"
      >
        {STEPS.map((step, i) => (
          <div key={step.key} role="listitem" className="flex items-start">
            <FunnelStep
              icon={step.icon}
              label={step.label}
              sublabel={step.sublabel}
              value={values[step.key] ?? 0}
              color={STEP_COLORS[i]}
              index={i}
              isLast={i === STEPS.length - 1}
            />
          </div>
        ))}
      </menu>

      {/* Source breakdown */}
      <div
        className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5"
        aria-label="Documents by source"
      >
        {(Object.entries(meta.sourceCounts) as [keyof typeof SOURCE_CONFIG, number][]).map(
          ([source, count]) => {
            const cfg = SOURCE_CONFIG[source];
            if (!cfg) return null;
            return (
              <span
                key={source}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${cfg.bgClass} ${cfg.textClass}`}
              >
                {cfg.label}
                <span className="font-mono font-semibold">{count}</span>
              </span>
            );
          }
        )}
      </div>
    </section>
  );
}
