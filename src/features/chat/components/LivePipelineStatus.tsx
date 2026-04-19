/**
 * LivePipelineStatus.tsx
 *
 * Replaces the skeleton loader during an active SSE stream.
 * Each pipeline stage lights up as the corresponding event arrives,
 * with animated count-up numbers and a stage-progress indicator.
 *
 * This component is ONLY shown while `isStreaming === true`.
 * Once the `complete` event fires the parent swaps it for <StructuredResponse />.
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, CheckCircle2, ChevronRight, Circle,
  Clock, Database, Filter, FlaskConical, Loader2,
  Search, Shield, Sparkles, Zap
} from 'lucide-react';
import type { StreamProgress, StreamStage } from '@/types';
import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/lib/utils';

// ─── Stage definitions ───────────────────────────────────────────────────────

interface StageDef {
  key:       StreamStage;
  label:     string;
  sublabel:  (p: StreamProgress) => string;
  icon:      React.ElementType;
  /** Numeric value to animate when this stage is active (undefined = no counter) */
  value:     (p: StreamProgress) => number | undefined;
}

const STAGES: StageDef[] = [
  {
    key:      'intent_extracted',
    label:    'Understanding query',
    sublabel: (p) => p.disease ? `Disease: ${p.disease}` : 'Extracting intent…',
    icon:     Search,
    value:    () => undefined,
  },
  {
    key:      'source_completed',
    label:    'Retrieving papers',
    sublabel: (p) => {
      const done = p.completedSources;
      const names = Object.entries(p.sourceCounts)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' · ');
      return done < 3 ? `Fetching ${3 - done} more source${3 - done !== 1 ? 's' : ''}…` : names;
    },
    icon:     Database,
    value:    (p) => p.totalRetrieved,
  },
  {
    key:      'deduplication_done',
    label:    'Deduplicating',
    sublabel: (p) =>
      p.afterDeduplication != null
        ? `${p.totalRetrieved! - p.afterDeduplication!} duplicates removed`
        : 'Merging sources…',
    icon:     Filter,
    value:    (p) => p.afterDeduplication,
  },
  {
    key:      'ranking_done',
    label:    'Ranking for AI',
    sublabel: (p) =>
      p.filteredForLLM != null
        ? `Top ${p.filteredForLLM} selected`
        : 'Scoring by recency & authority…',
    icon:     Zap,
    value:    (p) => p.filteredForLLM,
  },
  {
    key:      'llm_started',
    label:    'AI synthesis',
    sublabel: (p) =>
      p.stage === 'llm_completed' || p.stage === 'guardrails_done' || p.stage === 'complete'
        ? `${p.rawInsightCount ?? 0} insights generated`
        : 'LLM reasoning…',
    icon:     Brain,
    value:    () => undefined,
  },
  {
    key:      'guardrails_done',
    label:    'Verifying citations',
    sublabel: (p) =>
      p.finalInsightCount != null
        ? `${p.finalInsightCount} insights verified`
        : 'Checking claims against abstracts…',
    icon:     Shield,
    value:    (p) => p.finalInsightCount,
  },
];

/** Ordered list of all stages — used to determine which are complete */
const STAGE_ORDER: StreamStage[] = [
  'idle', 'intent_extracted', 'retrieval_started', 'source_completed',
  'deduplication_done', 'ranking_done', 'reranking_done',
  'llm_started', 'llm_completed', 'guardrails_done', 'complete', 'error',
];

function stageIndex(s: StreamStage): number {
  return STAGE_ORDER.indexOf(s);
}

function isStageComplete(def: StageDef, current: StreamStage): boolean {
  return stageIndex(current) > stageIndex(def.key);
}

function isStageActive(def: StageDef, current: StreamStage): boolean {
  // "source_completed" maps to retrieval_started + source_completed
  if (def.key === 'source_completed') {
    const idx = stageIndex(current);
    return idx >= stageIndex('retrieval_started') && idx <= stageIndex('deduplication_done');
  }
  if (def.key === 'llm_started') {
    const idx = stageIndex(current);
    return idx >= stageIndex('llm_started') && idx <= stageIndex('guardrails_done');
  }
  return current === def.key;
}

// ─── Animated counter ────────────────────────────────────────────────────────

function AnimatedCount({ value, isActive }: { value: number | undefined; isActive: boolean }) {
  const displayVal = useCountUp(value ?? 0, 700, 0);
  if (value === undefined || (!isActive && value === 0)) return null;
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-lg font-semibold tabular-nums text-teal-700 dark:text-teal-400"
    >
      {displayVal.toLocaleString()}
    </motion.span>
  );
}

// ─── Individual stage row ─────────────────────────────────────────────────────

function StageRow({ def, progress, isLast }: { def: StageDef; progress: StreamProgress; isLast: boolean }) {
  const current   = progress.stage;
  const complete  = isStageComplete(def, current);
  const active    = isStageActive(def, current);
  const pending   = !complete && !active;
  const Icon      = def.icon;
  const countVal  = def.value(progress);

  return (
    <motion.div
      layout
      className="flex items-start gap-3"
    >
      {/* Icon + connector line */}
      <div className="flex flex-col items-center flex-shrink-0">
        <motion.div
          animate={{
            background: complete ? '#059669' : active ? '#0F766E' : '#E2E8F0',
            borderColor: complete ? '#059669' : active ? '#0D9488' : '#E2E8F0',
          }}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors',
            'dark:border-slate-700'
          )}
        >
          {complete && <CheckCircle2 size={16} className="text-white" aria-hidden="true" />}
          {active   && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 size={15} className="text-white" aria-hidden="true" />
            </motion.div>
          )}
          {pending && <Icon size={14} className="text-slate-400 dark:text-slate-500" aria-hidden="true" />}
        </motion.div>

        {/* Connector line to next step */}
        {!isLast && (
          <motion.div
            className="w-px flex-1 mt-1"
            animate={{ background: complete ? '#059669' : '#E2E8F0' }}
            style={{ minHeight: 24 }}
          />
        )}
      </div>

      {/* Stage content */}
      <div className={cn(
        'flex-1 pb-4 min-w-0 transition-opacity duration-300',
        pending && 'opacity-40'
      )}>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className={cn(
            'text-sm font-medium',
            complete ? 'text-slate-700 dark:text-slate-300' :
            active   ? 'text-teal-700 dark:text-teal-400' :
                       'text-slate-400 dark:text-slate-500'
          )}>
            {def.label}
          </span>
          <AnimatedCount value={countVal} isActive={active || complete} />
        </div>

        <AnimatePresence>
          {(active || complete) && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug"
            >
              {def.sublabel(progress)}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Source pills ─────────────────────────────────────────────────────────────

const SOURCE_STYLES = {
  PubMed:         { text: 'text-teal-700 dark:text-teal-400',   bg: 'bg-teal-50 dark:bg-teal-900/20   border-teal-200 dark:border-teal-800'   },
  OpenAlex:       { text: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' },
  ClinicalTrials: { text: 'text-amber-700 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20   border-amber-200 dark:border-amber-800'   },
} as const;

// ─── Current stage label ──────────────────────────────────────────────────────

const STAGE_LABELS: Partial<Record<StreamStage, string>> = {
  idle:              'Starting pipeline…',
  intent_extracted:  'Query understood',
  retrieval_started: 'Fetching papers…',
  source_completed:  'Retrieving…',
  deduplication_done:'Deduplication done',
  ranking_done:      'Papers ranked',
  reranking_done:    'Reranking done',
  llm_started:       'AI is reasoning…',
  llm_completed:     'Synthesis done',
  guardrails_done:   'Claims verified',
  complete:          'Complete',
  error:             'Error',
};

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  progress: StreamProgress;
}

export function LivePipelineStatus({ progress }: Props) {
  const hasAnySources = Object.values(progress.sourceCounts).some((v) => v > 0);
  const stageLabel    = STAGE_LABELS[progress.stage] ?? 'Processing…';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-card overflow-hidden"
      aria-label="Research pipeline progress"
      aria-live="polite"
      aria-busy="true"
    >
      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-teal-500"
            aria-hidden="true"
          />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Live Pipeline
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
          <Clock size={11} aria-hidden="true" />
          <motion.span
            key={stageLabel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs font-mono"
          >
            {stageLabel}
          </motion.span>
        </div>
      </div>

      {/* ── Stage list ── */}
      <div className="px-4 pt-4">
        {STAGES.map((def, i) => (
          <StageRow
            key={def.key}
            def={def}
            progress={progress}
            isLast={i === STAGES.length - 1}
          />
        ))}
      </div>

      {/* ── Live source breakdown (appears once first source returns) ── */}
      <AnimatePresence>
        {hasAnySources && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 px-4 pb-4 border-t border-slate-100 dark:border-slate-800 pt-3">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center font-medium uppercase tracking-wider">
                Sources
              </span>
              {(Object.entries(progress.sourceCounts) as [keyof typeof SOURCE_STYLES, number][])
                .filter(([, count]) => count > 0)
                .map(([source, count]) => {
                  const style = SOURCE_STYLES[source];
                  return (
                    <motion.span
                      key={source}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
                        style.bg, style.text
                      )}
                    >
                      {source === 'ClinicalTrials' ? 'CT.gov' : source}
                      <span className="font-mono font-semibold">{count}</span>
                      {progress.sourceErrors[source] && (
                        <span className="text-red-500 ml-0.5" title={progress.sourceErrors[source]}>!</span>
                      )}
                    </motion.span>
                  );
                })}
              {/* Pending source pills */}
              {progress.completedSources < 3 && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                  <Loader2 size={10} className="animate-spin" aria-hidden="true" />
                  {3 - progress.completedSources} more…
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LLM model badge ── */}
      <AnimatePresence>
        {progress.llmModel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 pb-3 flex items-center gap-1.5"
          >
            <Sparkles size={11} className="text-teal-600 dark:text-teal-400" aria-hidden="true" />
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              {progress.llmModel} · {progress.llmDocs} docs in context
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
