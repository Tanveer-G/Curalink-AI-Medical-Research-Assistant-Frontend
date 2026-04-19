/**
 * MessageList.tsx
 *
 * Renders the conversation history plus a live streaming bubble when an
 * SSE request is in-flight.
 *
 * Key behaviours:
 *   • While isStreaming=true  → shows <LivePipelineStatus progress={...} />
 *     in the last assistant slot, updating in real time.
 *   • Once complete event fires → addAssistantMessage() commits the final data,
 *     isStreaming goes false, and <StructuredResponse /> replaces the live view.
 *   • Fast connections (< ~300ms) may briefly show the skeleton fallback before
 *     the first SSE event arrives — that's by design; it prevents layout flash.
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Bot, User } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { StructuredResponse } from './StructuredResponse';
import { LivePipelineStatus } from './LivePipelineStatus';
import { Skeleton } from '@/components/ui/skeleton';
import type { Message, AssistantMessage, UserMessage, ErrorMessage } from '@/types';
import { timeAgo } from '@/lib/utils';

// ─── Skeleton fallback (shown before first SSE event arrives) ─────────────────

function InitialSkeleton() {
  return (
    <div className="space-y-3 w-full" aria-label="Loading…" aria-busy="true">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-2.5 w-12" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-4 space-y-3">
        <div className="flex gap-4 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-3 w-40" />
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/40 p-4 space-y-2">
          <Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-11/12" /><Skeleton className="h-3 w-4/5" />
        </div>
      </div>
    </div>
  );
}

// ─── Message renderers ────────────────────────────────────────────────────────

function UserBubble({ msg }: { msg: UserMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="flex items-end justify-end gap-2"
      role="article"
      aria-label="Your message"
    >
      <div className="flex flex-col items-end gap-1 max-w-[85%] sm:max-w-[68%]">
        <div className="bg-teal-700 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed">
          {msg.content}
        </div>
        <time
          className="text-[10px] text-slate-400 dark:text-slate-500 pr-1"
          dateTime={new Date(msg.timestamp).toISOString()}
        >
          {timeAgo(msg.timestamp)}
        </time>
      </div>
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/30
                   border border-teal-200 dark:border-teal-700/50
                   flex items-center justify-center"
        aria-hidden="true"
      >
        <User size={13} className="text-teal-700 dark:text-teal-400" />
      </div>
    </motion.div>
  );
}

function AssistantBubble({ msg }: { msg: AssistantMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="flex items-start gap-2"
      role="article"
      aria-label="Curalink response"
    >
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800
                   border border-slate-200 dark:border-slate-700
                   flex items-center justify-center mt-0.5"
        aria-hidden="true"
      >
        <Bot size={13} className="text-slate-500 dark:text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <StructuredResponse data={msg.data} meta={msg.meta} query={msg.content} />
        <time
          className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block pl-1"
          dateTime={new Date(msg.timestamp).toISOString()}
        >
          {timeAgo(msg.timestamp)}
        </time>
      </div>
    </motion.div>
  );
}

function ErrorBubble({ msg }: { msg: ErrorMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2"
      role="alert"
      aria-live="assertive"
    >
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full bg-red-50 dark:bg-red-900/20
                   border border-red-200 dark:border-red-700/50
                   flex items-center justify-center"
        aria-hidden="true"
      >
        <AlertCircle size={13} className="text-red-600 dark:text-red-400" />
      </div>
      <div className="rounded-xl rounded-tl-sm border border-red-100 dark:border-red-800/40
                      bg-red-50 dark:bg-red-900/10 px-3 py-2.5 max-w-[85%]">
        <p className="text-sm text-red-700 dark:text-red-400">{msg.content}</p>
      </div>
    </motion.div>
  );
}

function renderMessage(msg: Message) {
  switch (msg.role) {
    case 'user':      return <UserBubble      key={msg.id} msg={msg} />;
    case 'assistant': return <AssistantBubble key={msg.id} msg={msg} />;
    case 'error':     return <ErrorBubble     key={msg.id} msg={msg} />;
  }
}

// ─── Live streaming bubble ────────────────────────────────────────────────────

/**
 * Rendered while isStreaming=true.  Shows either the initial skeleton (before
 * the first SSE event) or the live <LivePipelineStatus />.
 */
function StreamingBubble({ progress }: { progress: import('@/types').StreamProgress }) {
  const isIdle = progress.stage === 'idle';

  return (
    <motion.div
      key="streaming-bubble"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-2"
    >
      {/* Bot icon with pulse animation while streaming */}
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800
                   border border-teal-200 dark:border-teal-700/50
                   flex items-center justify-center mt-0.5"
        aria-hidden="true"
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          <Bot size={13} className="text-teal-600 dark:text-teal-400" />
        </motion.div>
      </div>

      <div className="flex-1 min-w-0">
        {/* Before first event: brief skeleton to prevent blank flash */}
        {isIdle
          ? <InitialSkeleton />
          : <LivePipelineStatus progress={progress} />
        }
      </div>
    </motion.div>
  );
}

// ─── MessageList ──────────────────────────────────────────────────────────────

export function MessageList() {
  const messages      = useChatStore((s) => s.messages);
  const isStreaming   = useChatStore((s) => s.isStreaming);
  const streamProgress = useChatStore((s) => s.streamProgress);
  const bottomRef     = useRef<HTMLDivElement>(null);

  // Auto-scroll on each new message or streaming progress update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isStreaming, streamProgress.stage]);

  return (
    <main
      className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-5 space-y-5"
      id="message-feed"
      aria-label="Conversation"
      aria-live="polite"
    >
      {/* Stored messages */}
      <AnimatePresence initial={false}>
        {messages.map((msg) => renderMessage(msg))}
      </AnimatePresence>

      {/* Live streaming bubble — shown only while SSE is active */}
      <AnimatePresence>
        {isStreaming && (
          <StreamingBubble progress={streamProgress} />
        )}
      </AnimatePresence>

      <div ref={bottomRef} className="h-1" aria-hidden="true" />
    </main>
  );
}
