import { motion } from 'framer-motion';
import { MapPin, ExternalLink, FlaskConical } from 'lucide-react';
import type { ClinicalTrial } from '@/types';
import { getStatusKey, truncate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  recruiting: { label: 'Recruiting',  dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/50' },
  completed:  { label: 'Completed',   dot: 'bg-indigo-500',  badge: 'bg-indigo-50  text-indigo-700  border-indigo-200  dark:bg-indigo-900/20  dark:text-indigo-400  dark:border-indigo-700/50'  },
  active:     { label: 'Active',      dot: 'bg-amber-500',   badge: 'bg-amber-50   text-amber-700   border-amber-200   dark:bg-amber-900/20   dark:text-amber-400   dark:border-amber-700/50'   },
  terminated: { label: 'Terminated',  dot: 'bg-red-500',     badge: 'bg-red-50     text-red-700     border-red-200     dark:bg-red-900/20     dark:text-red-400     dark:border-red-700/50'     },
  unknown:    { label: 'Unknown',     dot: 'bg-slate-400',   badge: 'bg-slate-50   text-slate-600   border-slate-200   dark:bg-slate-800     dark:text-slate-400   dark:border-slate-700'     },
} as const;

interface Props {
  trial: ClinicalTrial;
  index: number;
}

export function TrialCard({ trial, index }: Props) {
  const statusKey = getStatusKey(trial.status);
  const status    = STATUS_CONFIG[statusKey];

  return (
    <motion.article
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.25 }}
      className="group rounded-xl border border-slate-200 dark:border-slate-700/60
                 bg-white dark:bg-slate-900
                 p-3 sm:p-4
                 hover:border-slate-300 dark:hover:border-slate-600
                 hover:shadow-sm transition-all duration-200"
      aria-label={`Clinical trial: ${trial.title}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="flex-shrink-0 w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/20
                     border border-amber-200 dark:border-amber-700/40
                     flex items-center justify-center"
          aria-hidden="true"
        >
          <FlaskConical size={15} className="text-amber-600 dark:text-amber-400" />
        </div>

        <div className="flex-1 min-w-0">
          {/* NCT ID + Status */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <code className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
              {trial.nctId}
            </code>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                status.badge
              )}
              aria-label={`Status: ${status.label}`}
            >
              <span
                className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', status.dot)}
                aria-hidden="true"
              />
              {status.label}
            </span>
          </div>

          {/* Title */}
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug font-medium
                        group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">
            {truncate(trial.title, 120)}
          </p>

          {/* Location + link */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5">
            {trial.location && (
              <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                <MapPin size={11} aria-hidden="true" />
                <span className="truncate max-w-[200px]">{trial.location}</span>
              </div>
            )}
            <a
              href={trial.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium
                         text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1
                         rounded ml-auto"
              aria-label={`View trial ${trial.nctId} on ClinicalTrials.gov`}
            >
              View on CT.gov
              <ExternalLink size={11} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
