/**
 * ChatInput.tsx
 *
 * The query entry field. Delegates to useStreamQuery (via useChatMutation shim)
 * so sending a query kicks off the SSE stream automatically.
 *
 * Disabled while isStreaming=true (read from store) so the user can't submit
 * a second query while the pipeline is running.  An abort button appears
 * during streaming so the user can cancel if needed.
 */

import { useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore, selectIsBlocked } from '@/store/chatStore';
import { useStreamQuery } from '@/hooks/useStreamQuery';
import { useSession } from '../hooks/useSession';
import { cn } from '@/lib/utils';
import { EXAMPLE_QUERIES } from '@/lib/constants';

const schema = z.object({ query: z.string().min(3).max(1000) });
type FormData = z.infer<typeof schema>;

export function ChatInput() {
  const { sendQuery, abort, isStreaming } = useStreamQuery();
  const { currentDisease, hasSession, clearSession } = useSession();
  const isBlocked  = useChatStore(selectIsBlocked);
  const hasMessages = useChatStore((s) => s.messages.length > 0);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { register, handleSubmit, reset, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const query = watch('query') ?? '';

  // ── Auto-resize textarea ─────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [query]);

  // ── ⌘K / Ctrl+K → focus ──────────────────────────────────────────────
  const focusInput = useCallback(() => textareaRef.current?.focus(), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        focusInput();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusInput]);

  // ── Form submit ───────────────────────────────────────────────────────
  const onSubmit = async ({ query }: FormData) => {
    reset();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await sendQuery(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  // ── Populate from example chip ────────────────────────────────────────
  const handleChip = (text: string) => {
    setValue('query', text, { shouldValidate: true });
    focusInput();
  };

  const { ref: formRef, ...registerRest } = register('query');
  const setRef = (el: HTMLTextAreaElement | null) => {
    (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
    formRef(el);
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">

      {/* ── Active disease context strip ── */}
      <AnimatePresence>
        {hasSession && currentDisease && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 sm:px-4 md:px-6 pt-2.5 flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full
                              bg-teal-50 dark:bg-teal-900/30
                              border border-teal-200 dark:border-teal-700/50
                              px-2.5 py-1 text-xs font-medium text-teal-700 dark:text-teal-400">
                <Activity size={11} aria-hidden="true" />
                Context: <span className="font-semibold ml-1">{currentDisease}</span>
                <button
                  onClick={clearSession}
                  className="ml-1 rounded-full hover:bg-teal-100 dark:hover:bg-teal-800
                             w-4 h-4 flex items-center justify-center transition-colors
                             focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
                  aria-label="Clear session context"
                >
                  <X size={10} aria-hidden="true" />
                </button>
              </div>

              {/* Streaming indicator */}
              <AnimatePresence>
                {isStreaming && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5"
                  >
                    <motion.span
                      className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      aria-hidden="true"
                    />
                    Pipeline running…
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Example chips (only when no messages yet) ── */}
      {/* <AnimatePresence>
        {!hasMessages && !isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 sm:px-4 md:px-6 pt-2.5 overflow-x-auto no-scrollbar"
          >
            <div className="flex gap-2 pb-1" role="list" aria-label="Example queries">
              {EXAMPLE_QUERIES.slice(0, 4).map((q) => (
                <button
                  key={q.text}
                  role="listitem"
                  onClick={() => handleChip(q.text)}
                  className="flex-shrink-0 flex items-center gap-1.5 rounded-full
                             border border-slate-200 dark:border-slate-700
                             bg-white dark:bg-slate-900
                             px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400
                             hover:border-teal-300 dark:hover:border-teal-600
                             hover:text-teal-700 dark:hover:text-teal-400
                             hover:bg-teal-50 dark:hover:bg-teal-900/20
                             transition-all duration-150
                             focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-teal-500 focus-visible:ring-offset-1"
                  aria-label={`Use example: ${q.text}`}
                >
                  <span aria-hidden="true">{q.icon}</span>
                  {q.tag}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence> */}

      {/* ── Input row ── */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-end gap-2 sm:gap-3 max-w-4xl mx-auto"
        aria-label="Medical research query form"
      >
        {/* Textarea */}
        <div className="flex-1 relative">
          <label htmlFor="chat-input" className="sr-only">Medical research query</label>
          <textarea
            {...registerRest}
            ref={setRef}
            id="chat-input"
            rows={1}
            disabled={isBlocked}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming
              ? 'Pipeline running — please wait…'
              : 'Ask a medical research question… (⌘K)'}
            aria-label="Medical research query"
            aria-disabled={isBlocked}
            className={cn(
              'w-full resize-none rounded-xl border bg-slate-50 dark:bg-slate-800/60',
              'px-4 py-3 text-sm sm:text-[15px] leading-relaxed',
              'text-slate-800 dark:text-slate-100',
              'placeholder:text-slate-400 dark:placeholder:text-slate-500',
              'border-slate-200 dark:border-slate-700',
              'hover:border-slate-300 dark:hover:border-slate-600',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:border-teal-400',
              'dark:focus-visible:border-teal-500',
              'transition-all duration-150',
              'disabled:cursor-not-allowed disabled:opacity-60',
              'max-h-40 overflow-y-auto',
              isStreaming && 'border-teal-200 dark:border-teal-700/50'
            )}
          />

          {/* Character counter */}
          {query.length > 800 && (
            <div
              aria-live="polite"
              className={cn(
                'absolute bottom-2.5 right-3 text-[10px] font-mono',
                query.length > 950 ? 'text-red-500' : 'text-slate-400'
              )}
            >
              {query.length}/1000
            </div>
          )}
        </div>

        {/* Send / Abort button */}
        <motion.div whileTap={{ scale: 0.93 }}>
          {isStreaming ? (
            /* Abort button — cancel the stream */
            <Button
              type="button"
              variant="secondary"
              onClick={abort}
              className="rounded-full w-11 h-11 flex-shrink-0 p-0 border border-slate-200 dark:border-slate-700
                         hover:border-red-300 hover:text-red-600 dark:hover:border-red-600 dark:hover:text-red-400"
              aria-label="Cancel pipeline"
              title="Cancel pipeline"
            >
              <X size={16} aria-hidden="true" />
            </Button>
          ) : (
            /* Send button */
            <Button
              type="submit"
              variant="primary"
              disabled={isBlocked || query.trim().length < 3}
              className="rounded-full w-11 h-11 flex-shrink-0 p-0 shadow-md"
              aria-label="Send query"
            >
              <Send size={16} aria-hidden="true" className="translate-x-0.5" />
            </Button>
          )}
        </motion.div>
      </form>

      {/* Keyboard hint */}
      <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 pb-2 hidden sm:block">
        <kbd className="font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 py-0.5 rounded text-[10px]">Enter</kbd>{' '}send ·{' '}
        <kbd className="font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 py-0.5 rounded text-[10px]">Shift+Enter</kbd>{' '}new line ·{' '}
        <kbd className="font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 py-0.5 rounded text-[10px]">⌘K</kbd>{' '}focus
        {isStreaming && (
          <span className="ml-2 text-teal-600 dark:text-teal-400 font-medium">
            · ✕ to cancel
          </span>
        )}
      </p>
    </div>
  );
}
