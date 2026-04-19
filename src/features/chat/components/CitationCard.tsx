import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ExternalLink, Copy, CheckCircle2, Quote
} from 'lucide-react';
import type { ResearchInsight } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { cn, copyToClipboard } from '@/lib/utils';
import { toast } from 'sonner';

/* ── Source helpers ──────────────────────────────────────────────────────── */
function getSourceMeta(citationId: string): {
  label: string;
  variant: 'teal' | 'indigo' | 'amber';
  url: string | null;
  shortId: string;
} {
  if (citationId.startsWith('pubmed_')) {
    const id = citationId.replace('pubmed_', '');
    return { label: 'PubMed', variant: 'teal', url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`, shortId: id };
  }
  if (citationId.startsWith('openalex_')) {
    const id = citationId.replace('openalex_', '');
    return { label: 'OpenAlex', variant: 'indigo', url: `https://openalex.org/${id}`, shortId: id.slice(0, 10) };
  }
  if (citationId.startsWith('ctgov_')) {
    const id = citationId.replace('ctgov_', '');
    return { label: 'ClinicalTrials', variant: 'amber', url: `https://clinicaltrials.gov/study/${id}`, shortId: id };
  }
  return { label: 'Source', variant: 'teal', url: null, shortId: citationId.slice(0, 12) };
}

/* ── Component ───────────────────────────────────────────────────────────── */
interface Props {
  insight: ResearchInsight;
  index: number;
}

export function CitationCard({ insight, index }: Props) {
  const [expanded, setExpanded]   = useState(false);
  const [copied, setCopied]       = useState(false);
  const source = getSourceMeta(insight.citationId);

  const handleCopySnippet = async () => {
    await copyToClipboard(insight.snippet);
    setCopied(true);
    toast.success('Snippet copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider>
      <motion.article
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.25 }}
        className={cn(
          'rounded-xl border transition-all duration-200 overflow-hidden',
          expanded
            ? 'border-teal-200 dark:border-teal-700/50 bg-white dark:bg-slate-900'
            : 'border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900',
          'hover:border-slate-300 dark:hover:border-slate-600'
        )}
        aria-label={`Research insight ${index + 1}`}
      >
        {/* ── Main row ── */}
        <div className="flex items-start gap-3 p-3 sm:p-4">
          {/* Index badge */}
          <div
            className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-50 dark:bg-teal-900/30
                       border border-teal-200 dark:border-teal-700/50
                       flex items-center justify-center mt-0.5"
            aria-hidden="true"
          >
            <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400">
              {index + 1}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Finding */}
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {insight.finding}
            </p>

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {/* Source badge */}
              <Badge variant={source.variant}>
                {source.label}
                <span className="opacity-60 font-mono">{source.shortId.slice(0, 8)}</span>
              </Badge>

              {/* Verified badge */}
              <span
                className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
                aria-label="Citation verified by AI guardrail"
              >
                <CheckCircle2 size={11} aria-hidden="true" />
                Verified
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center gap-1 ml-1">
            <Tooltip label={copied ? 'Copied!' : 'Copy snippet'}>
              <Button
                variant="ghost" size="icon"
                onClick={handleCopySnippet}
                aria-label={copied ? 'Copied' : 'Copy abstract snippet'}
                className="h-7 w-7 text-slate-400 hover:text-teal-700 dark:hover:text-teal-400"
              >
                {copied
                  ? <CheckCircle2 size={13} className="text-emerald-600" aria-hidden="true" />
                  : <Copy size={13} aria-hidden="true" />}
              </Button>
            </Tooltip>

            {/* Expand / collapse */}
            <Button
              variant="ghost" size="icon"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-label={expanded ? 'Collapse abstract snippet' : 'Show abstract snippet'}
              className="h-7 w-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <ChevronDown
                size={14}
                aria-hidden="true"
                className={cn('transition-transform duration-200', expanded && 'rotate-180')}
              />
            </Button>
          </div>
        </div>

        {/* ── Expanded snippet ── */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 border-t border-slate-100 dark:border-slate-800">
                {/* Abstract block-quote */}
                <div className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/40 p-3 relative">
                  <Quote
                    size={14}
                    className="absolute top-2.5 left-2.5 text-slate-300 dark:text-slate-600"
                    aria-hidden="true"
                  />
                  <p className="pl-5 text-xs leading-relaxed text-slate-600 dark:text-slate-400 italic">
                    "{insight.snippet}"
                  </p>
                </div>

                {/* External link */}
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-medium
                               text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1
                               rounded"
                  >
                    View source paper
                    <ExternalLink size={11} aria-hidden="true" />
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>
    </TooltipProvider>
  );
}
