import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Globe, BookMarked } from 'lucide-react';
import { useChatMutation } from '@/features/chat/hooks/useChatMutation';
import { EXAMPLE_QUERIES } from '@/lib/constants';
import { LogoLockup } from './Logo';

const FEATURES = [
  { icon: Globe,       label: '3 live databases',          sub: 'PubMed · OpenAlex · ClinicalTrials' },
  { icon: Zap,         label: 'AI synthesis in seconds',   sub: 'Llama-3.1-8B novita with retrieval grounding' },
  { icon: ShieldCheck, label: 'Hallucination-guarded',     sub: 'Every claim citation-verified'       },
  { icon: BookMarked,  label: 'Follow-up aware',           sub: 'Session memory for multi-turn Q&A'   },
] as const;

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden:   { opacity: 0, y: 12 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function WelcomeScreen() {
  const { sendMessage, isPending } = useChatMutation();

  return (
    <div
      className="flex-1 overflow-y-auto flex flex-col items-center justify-center1 px-4 py-10 sm:py-16"
      role="main"
      aria-label="Welcome to Curalink"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-2xl mx-auto space-y-8"
      >
        {/* Logo + headline */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          {/* <div className="flex justify-center">
            <LogoLockup />
          </div> */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-800 dark:text-slate-100 text-balance">
              Evidence-based medical research,{' '}
              <span className="text-teal-700 dark:text-teal-400">synthesised by AI</span>
            </h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-lg mx-auto text-balance">
              Ask any medical question. Curalink retrieves 50–300 research papers, ranks them, and delivers
              structured insights with verified citations — in seconds.
            </p>
          </div>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 gap-2"
          aria-label="Key features"
        >
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700/60
                           bg-white dark:bg-slate-900 p-3"
              >
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/20
                             border border-teal-100 dark:border-teal-800 flex items-center justify-center"
                  aria-hidden="true"
                >
                  <Icon size={15} className="text-teal-700 dark:text-teal-400" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-none">
                    {f.label}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-5">
                    {f.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Example queries */}
        <motion.div variants={itemVariants}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 text-center">
            Try asking
          </p>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
            role="list"
            aria-label="Example queries"
          >
            {EXAMPLE_QUERIES.map((q, i) => (
              <motion.button
                key={q.text}
                role="listitem"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                onClick={() => !isPending && sendMessage(q.text)}
                disabled={isPending}
                className="group flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700/60
                           bg-white dark:bg-slate-900 p-3
                           hover:border-teal-300 dark:hover:border-teal-600
                           hover:bg-teal-50/50 dark:hover:bg-teal-900/10
                           transition-all duration-150 text-left
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2
                           disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Ask: ${q.text}`}
              >
                <span className="text-lg flex-shrink-0 leading-none" aria-hidden="true">
                  {q.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <span
                    className="inline-block text-[10px] font-medium rounded-md px-1.5 py-0.5 mb-1
                               bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400
                               border border-teal-100 dark:border-teal-800"
                  >
                    {q.tag}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400
                                group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors leading-snug">
                    {q.text}
                  </p>
                </div>
                <ArrowRight
                  size={14}
                  className="flex-shrink-0 text-slate-300 dark:text-slate-600
                             group-hover:text-teal-600 dark:group-hover:text-teal-400
                             group-hover:translate-x-0.5 transition-all duration-150 mt-1"
                  aria-hidden="true"
                />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.p
          variants={itemVariants}
          className="text-center text-[11px] text-slate-400 dark:text-slate-500 max-w-sm mx-auto leading-relaxed"
        >
          For research and informational purposes only. Not a substitute for professional medical advice,
          diagnosis, or treatment.
        </motion.p>
      </motion.div>
    </div>
  );
}
