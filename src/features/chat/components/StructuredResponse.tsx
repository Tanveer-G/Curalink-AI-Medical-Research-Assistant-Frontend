import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Microscope, FlaskConical,
  Copy, Download, MoreHorizontal, CheckCircle2,
  ChevronDown, AlertTriangle, Sparkles
} from 'lucide-react';
import type { ResponseData, MetaData } from '@/types';
import { CitationCard } from './CitationCard';
import { TrialCard } from './TrialCard';
import { ResearchFunnel } from './ResearchFunnel';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { cn, copyToClipboard, downloadText, responseToText } from '@/lib/utils';
import { toast } from 'sonner';

/* ── Tab types ─────────────────────────────────────────────────────────────── */
type Tab = 'overview' | 'insights' | 'trials';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Overview', icon: BookOpen    },
  { key: 'insights', label: 'Insights', icon: Microscope  },
  { key: 'trials',   label: 'Trials',   icon: FlaskConical },
];

/* ── More actions dropdown ──────────────────────────────────────────────────── */
function MoreActionsMenu({
  onCopyAll,
  onDownload,
}: {
  onCopyAll: () => void;
  onDownload: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = () => setOpen(false);

  const handle = (fn: () => void) => {
    fn();
    close();
  };

  return (
    <div className="relative" ref={menuRef}>
      <Tooltip label="More actions">
        <Button
          variant="ghost" size="icon"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="More actions"
          className="h-7 w-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <MoreHorizontal size={15} aria-hidden="true" />
        </Button>
      </Tooltip>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={close}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              role="menu"
              className="absolute right-0 top-full mt-1 z-50 w-44
                         rounded-xl border border-slate-200 dark:border-slate-700
                         bg-white dark:bg-slate-900 shadow-lg py-1 overflow-hidden"
            >
              <button
                role="menuitem"
                onClick={() => handle(onCopyAll)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-300
                           hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Copy size={13} aria-hidden="true" className="text-slate-400" />
                Copy all text
              </button>
              <button
                role="menuitem"
                onClick={() => handle(onDownload)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-300
                           hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Download size={13} aria-hidden="true" className="text-slate-400" />
                Download .txt
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Overview section ────────────────────────────────────────────────────────── */
function OverviewTab({ text }: { text: string }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div>
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center justify-between w-full mb-3 group
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 rounded"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-teal-600 dark:text-teal-400" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Condition Overview
          </span>
        </div>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={cn(
            'text-slate-400 transition-transform duration-200',
            collapsed && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/60 p-4">
              <p className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
                {text || 'Insufficient evidence in provided literature.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Empty section ───────────────────────────────────────────────────────────── */
function EmptyTab({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center" role="status">
      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <Icon size={18} className="text-slate-400 dark:text-slate-500" aria-hidden="true" />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">{message}</p>
    </div>
  );
}

/* ── Main StructuredResponse ─────────────────────────────────────────────────── */
interface Props {
  data: ResponseData;
  meta: MetaData;
  query?: string;
}

export function StructuredResponse({ data, meta, query = '' }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [copied, setCopied]       = useState(false);

  const counts: Record<Tab, number | null> = {
    overview: null,
    insights: data.researchInsights.length,
    trials:   data.clinicalTrials.length,
  };

  const handleCopyActive = async () => {
    let text = '';
    if (activeTab === 'overview') text = data.conditionOverview;
    else if (activeTab === 'insights')
      text = data.researchInsights.map((i, n) => `${n + 1}. ${i.finding}`).join('\n');
    else text = data.clinicalTrials.map((t) => `${t.title} [${t.nctId}] — ${t.status}`).join('\n');

    await copyToClipboard(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAll = async () => {
    await copyToClipboard(responseToText(data, query));
    toast.success('Full response copied');
  };

  const handleDownload = () => {
    downloadText('curalink-research.txt', responseToText(data, query));
    toast.success('Report downloaded');
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-3 w-full"
        role="region"
        aria-label="Research results"
      >
        {/* Pipeline funnel */}
        <ResearchFunnel meta={meta} insightCount={data.researchInsights.length} />

        {/* Main response card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 overflow-hidden shadow-card">

          {/* ── Tab bar ── */}
          <div
            className="flex items-center border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 overflow-x-auto no-scrollbar"
            role="tablist"
            aria-label="Response sections"
          >
            {/* Tabs */}
            <div className="flex items-center flex-1 overflow-x-auto no-scrollbar">
              {TABS.map((tab) => {
                const Icon    = tab.icon;
                const isActive = activeTab === tab.key;
                const count   = counts[tab.key];

                return (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.key}`}
                    id={`tab-${tab.key}`}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'relative flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium',
                      'whitespace-nowrap transition-colors duration-150 flex-shrink-0',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset',
                      isActive
                        ? 'text-teal-700 dark:text-teal-400'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    )}
                  >
                    <Icon size={13} aria-hidden="true" />
                    {tab.label}
                    {count !== null && count > 0 && (
                      <span
                        className={cn(
                          'ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                          isActive
                            ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        )}
                        aria-label={`${count} items`}
                      >
                        {count}
                      </span>
                    )}
                    {/* Active underline */}
                    {isActive && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-700 dark:bg-teal-500"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Action buttons — right side of tab bar */}
            <div className="flex items-center gap-0.5 px-2 flex-shrink-0 border-l border-slate-100 dark:border-slate-800">
              <Tooltip label={copied ? 'Copied!' : 'Copy section'}>
                <Button
                  variant="ghost" size="icon"
                  onClick={handleCopyActive}
                  aria-label="Copy current section"
                  className="h-7 w-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {copied
                    ? <CheckCircle2 size={13} className="text-emerald-600" aria-hidden="true" />
                    : <Copy size={13} aria-hidden="true" />}
                </Button>
              </Tooltip>
              <MoreActionsMenu onCopyAll={handleCopyAll} onDownload={handleDownload} />
            </div>
          </div>

          {/* ── Tab panels ── */}
          <div className="p-3 sm:p-4">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  role="tabpanel"
                  id="panel-overview"
                  aria-labelledby="tab-overview"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.15 }}
                >
                  <OverviewTab text={data.conditionOverview} />
                </motion.div>
              )}

              {activeTab === 'insights' && (
                <motion.div
                  key="insights"
                  role="tabpanel"
                  id="panel-insights"
                  aria-labelledby="tab-insights"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-2"
                >
                  {data.researchInsights.length === 0
                    ? <EmptyTab icon={Microscope} message="No verified insights could be extracted from the retrieved literature." />
                    : data.researchInsights.map((ins, i) => (
                        <CitationCard key={`${ins.citationId}-${i}`} insight={ins} index={i} />
                      ))}
                </motion.div>
              )}

              {activeTab === 'trials' && (
                <motion.div
                  key="trials"
                  role="tabpanel"
                  id="panel-trials"
                  aria-labelledby="tab-trials"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-2"
                >
                  {data.clinicalTrials.length === 0
                    ? <EmptyTab icon={FlaskConical} message="No clinical trials were found matching your query." />
                    : data.clinicalTrials.map((trial, i) => (
                        <TrialCard key={trial.nctId} trial={trial} index={i} />
                      ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Disclaimer */}
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 flex items-start gap-2 border-t border-slate-50 dark:border-slate-800/50">
            <AlertTriangle
              size={11}
              className="flex-shrink-0 mt-0.5 text-amber-500"
              aria-hidden="true"
            />
            <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
              {data.disclaimer}
            </p>
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
