/**
 * useStreamQuery.ts
 *
 * Drives the POST /api/query/stream SSE endpoint.
 * Parses the SSE wire format incrementally and reflects each pipeline event
 * into the Zustand store so the UI updates in real time.
 *
 * Returned API:
 *   sendQuery(query)  — begin a stream; adds user message immediately
 *   abort()           — cancel the current stream
 *   isStreaming       — reactive boolean (from store)
 *   progress          — reactive StreamProgress snapshot (from store)
 */

import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useChatStore, INITIAL_PROGRESS } from '@/store/chatStore';
import type { StreamProgress, MetaData, ResponseData } from '@/types';
import { API_URL } from '@/lib/constants';

// ─── SSE wire-format parser ──────────────────────────────────────────────────

/**
 * Incrementally parses chunked SSE data.
 *
 * The SSE spec separates events with `\n\n`. A single `reader.read()` call
 * may span multiple events, or land mid-event. This class buffers partial
 * data so no event is ever lost or duplicated.
 */
class SSEParser {
  private buf = '';

  /** Feed a decoded string chunk; get back all complete events extracted. */
  feed(chunk: string): Array<{ event: string; data: Record<string, unknown> }> {
    this.buf += chunk;

    // Split on the SSE event separator (double newline)
    const blocks = this.buf.split('\n\n');

    // Keep the last (possibly incomplete) block in the buffer
    this.buf = blocks.pop() ?? '';

    const events: Array<{ event: string; data: Record<string, unknown> }> = [];

    for (const block of blocks) {
      const parsed = this.parseBlock(block.trim());
      if (parsed) events.push(parsed);
    }

    return events;
  }

  reset() { this.buf = ''; }

  private parseBlock(block: string): { event: string; data: Record<string, unknown> } | null {
    if (!block) return null;

    let eventName = 'message';
    let dataLine  = '';

    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) eventName = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLine  = line.slice(5).trim();
      // Lines starting with `:` are SSE comments (heartbeat) — skip
    }

    if (!dataLine) return null;

    try {
      return { event: eventName, data: JSON.parse(dataLine) as Record<string, unknown> };
    } catch {
      return null; // malformed JSON — skip silently
    }
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useStreamQuery() {
  const {
    sessionId, setSessionId,
    addUserMessage, addAssistantMessage, addErrorMessage,
    setStreaming, updateProgress, resetProgress,
  } = useChatStore();

  const abortRef  = useRef<AbortController | null>(null);
  const parserRef = useRef(new SSEParser());

  /** Cancel an in-flight stream. Safe to call when idle. */
  const abort = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, [setStreaming]);

  /** Start the SSE stream for `query`. */
  const sendQuery = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // Cancel any existing stream before starting a new one
    abortRef.current?.abort();
    const controller  = new AbortController();
    abortRef.current  = controller;
    parserRef.current.reset();

    // Immediately commit the user message so the chat feels responsive
    addUserMessage(trimmed);

    // Reset progress and enter streaming mode
    resetProgress();
    setStreaming(true);

    try {
      const response = await fetch(`${API_URL}/api/query/stream`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept':       'text/event-stream',   // ← the key header
        },
        body:   JSON.stringify({ query: trimmed, sessionId: sessionId ?? undefined }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errMsg = `Server error: HTTP ${response.status}`;
        try {
          const body = await response.json() as { error?: string };
          if (body.error) errMsg = body.error;
        } catch { /* ignore */ }
        throw new Error(errMsg);
      }

      if (!response.body) throw new Error('Response body is null');

      const reader  = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      // ── Read loop — runs until stream closes ──────────────────────────
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk  = decoder.decode(value, { stream: true });
        const events = parserRef.current.feed(chunk);

        for (const { event, data } of events) {
          applyEvent(event, data, { query: trimmed, sessionId, setSessionId,
            updateProgress, addAssistantMessage, addErrorMessage, setStreaming });
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        // Intentional cancellation — nothing to show the user
        setStreaming(false);
        return;
      }
      const msg = (err as Error).message || 'Connection failed. Please try again.';
      addErrorMessage(msg);
      toast.error(msg, { duration: 5000 });
      setStreaming(false);
    }
  }, [
    sessionId, setSessionId,
    addUserMessage, addAssistantMessage, addErrorMessage,
    setStreaming, updateProgress, resetProgress,
  ]);

  return {
    sendQuery,
    abort,
    // Reactive slices — consumers re-render only when these change
    isStreaming: useChatStore((s) => s.isStreaming),
    progress:    useChatStore((s) => s.streamProgress),
  };
}

// ─── Event dispatcher ─────────────────────────────────────────────────────────

interface DispatchCtx {
  query:               string;
  sessionId:           string | null;
  setSessionId:        (id: string) => void;
  updateProgress:      (patch: Partial<StreamProgress>) => void;
  addAssistantMessage: (q: string, d: ResponseData, m: MetaData) => void;
  addErrorMessage:     (msg: string) => void;
  setStreaming:        (v: boolean) => void;
}

function applyEvent(
  event: string,
  data:  Record<string, unknown>,
  ctx:   DispatchCtx,
) {
  /**
   * Read current streamProgress synchronously (no re-render).
   * Needed for accumulative fields like sourceCounts.
   * useChatStore.getState() is the idiomatic Zustand pattern for
   * reading state outside React component rendering.
   */
  const currentProgress = () => useChatStore.getState().streamProgress;

  switch (event) {

    // ── Intent resolved ────────────────────────────────────────────────
    case 'intent_extracted':
      ctx.updateProgress({
        stage:        'intent_extracted',
        disease:      data.disease      as string,
        intent:       data.intent       as string,
        searchString: data.searchString as string,
      });
      break;

    // ── Parallel retrieval beginning ───────────────────────────────────
    case 'retrieval_started':
      ctx.updateProgress({
        stage:   'retrieval_started',
        sources: data.sources as string[],
      });
      break;

    // ── One source completed (accumulate counts across 3 calls) ────────
    case 'source_completed': {
      const src    = data.source as keyof StreamProgress['sourceCounts'];
      const count  = data.count  as number;
      const prev   = currentProgress();

      ctx.updateProgress({
        stage: 'source_completed',
        // Merge new count into the existing sourceCounts object
        sourceCounts: { ...prev.sourceCounts, [src]: count },
        // Merge any error for this source
        sourceErrors: data.error
          ? { ...prev.sourceErrors, [src]: data.error as string }
          : prev.sourceErrors,
        completedSources: prev.completedSources + 1,
      });
      break;
    }

    // ── Deduplication finished ─────────────────────────────────────────
    case 'deduplication_done':
      ctx.updateProgress({
        stage:              'deduplication_done',
        totalRetrieved:     data.rawCount    as number,
        afterDeduplication: data.uniqueCount as number,
      });
      break;

    // ── Heuristic ranking finished ─────────────────────────────────────
    case 'ranking_done':
      ctx.updateProgress({
        stage:          'ranking_done',
        filteredForLLM: data.topK as number,
      });
      break;

    // ── Semantic reranking finished (or skipped) ───────────────────────
    case 'reranking_done':
      ctx.updateProgress({
        stage:           'reranking_done',
        rankingCount:    data.count    as number,
        semanticEnabled: data.semantic as boolean,
      });
      break;

    // ── LLM synthesis started ──────────────────────────────────────────
    case 'llm_started':
      ctx.updateProgress({
        stage:    'llm_started',
        llmModel: data.model as string,
        llmDocs:  data.docs  as number,
      });
      break;

    // ── LLM synthesis finished ─────────────────────────────────────────
    case 'llm_completed':
      ctx.updateProgress({
        stage:           'llm_completed',
        rawInsightCount: data.insightCount as number,
      });
      break;

    // ── Citation guardrails applied ────────────────────────────────────
    case 'guardrails_done':
      ctx.updateProgress({
        stage:             'guardrails_done',
        finalInsightCount: data.insightCount as number,
      });
      break;

    // ── Full response payload received ─────────────────────────────────
    case 'complete': {
      const meta = data.meta as MetaData;
      // Fill in any final counts that weren't individually emitted
      ctx.updateProgress({
        stage:             'complete',
        processingTimeMs:  meta.processingTimeMs,
        // Ensure funnel values are always populated from the authoritative meta
        totalRetrieved:    meta.totalRetrieved,
        afterDeduplication:meta.afterDeduplication,
        filteredForLLM:    meta.filteredForLLM,
        sourceCounts:      meta.sourceCounts,
      });

      if (data.sessionId && data.sessionId !== ctx.sessionId) {
        ctx.setSessionId(data.sessionId as string);
      }

      ctx.addAssistantMessage(ctx.query, data.data as ResponseData, meta);
      ctx.setStreaming(false);
      break;
    }

    // ── Pipeline error ─────────────────────────────────────────────────
    case 'error': {
      const msg = (data.error as string) ?? 'Research pipeline error. Please try again.';
      ctx.updateProgress({ stage: 'error' });
      ctx.addErrorMessage(msg);
      toast.error(msg, { duration: 5000 });
      ctx.setStreaming(false);
      break;
    }

    // Unknown events — forward compatibility: ignore quietly
    default: break;
  }
}
