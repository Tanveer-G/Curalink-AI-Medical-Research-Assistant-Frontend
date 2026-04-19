import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Message, StreamProgress } from '@/types';
import { generateId } from '@/lib/utils';

/** Initial/reset value for streaming progress. */
export const INITIAL_PROGRESS: StreamProgress = {
  stage:            'idle',
  sourceCounts:     { PubMed: 0, OpenAlex: 0, ClinicalTrials: 0 },
  sourceErrors:     {},
  completedSources: 0,
};

interface ChatState {
  // ── Session ───────────────────────────────────────────────────────────
  sessionId: string | null;
  setSessionId: (id: string) => void;
  clearSession: () => void;

  // ── Messages ──────────────────────────────────────────────────────────
  messages: Message[];
  addUserMessage:      (content: string)                                                          => string;
  addAssistantMessage: (content: string, data: import('@/types').ResponseData, meta: import('@/types').MetaData) => void;
  addErrorMessage:     (content: string)                                                          => void;
  clearMessages: () => void;

  // ── Streaming state ──────────────────────────────────────────────────
  /** True while SSE stream is active (from first byte to `complete`/`error`). */
  isStreaming:  boolean;
  /** Reactive accumulation of pipeline events received so far. */
  streamProgress: StreamProgress;
  setStreaming:    (v: boolean) => void;
  updateProgress:  (patch: Partial<StreamProgress>) => void;
  resetProgress:   () => void;

  // ── Legacy loading flag (used by non-streaming paths) ────────────────
  isLoading: boolean;
  setLoading: (v: boolean) => void;

  // ── UI preferences ────────────────────────────────────────────────────
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      // ── Session ─────────────────────────────────────────────────────────
      sessionId:  null,
      setSessionId: (id) => set({ sessionId: id }),
      clearSession: ()  => set({ sessionId: null, messages: [] }),

      // ── Messages ─────────────────────────────────────────────────────────
      messages: [],

      addUserMessage: (content) => {
        const id = generateId();
        set((s) => ({
          messages: [
            ...s.messages,
            { id, role: 'user' as const, content, timestamp: Date.now() },
          ],
        }));
        return id;
      },

      addAssistantMessage: (content, data, meta) => {
        const id = generateId();
        set((s) => ({
          messages: [
            ...s.messages,
            { id, role: 'assistant' as const, content, data, meta, timestamp: Date.now() },
          ],
        }));
      },

      addErrorMessage: (content) => {
        const id = generateId();
        set((s) => ({
          messages: [
            ...s.messages,
            { id, role: 'error' as const, content, timestamp: Date.now() },
          ],
        }));
      },

      clearMessages: () => set({ messages: [], sessionId: null }),

      // ── Streaming ────────────────────────────────────────────────────────
      isStreaming:    false,
      streamProgress: INITIAL_PROGRESS,

      setStreaming: (v) => set({ isStreaming: v }),

      updateProgress: (patch) =>
        set((s) => ({
          streamProgress: { ...s.streamProgress, ...patch },
        })),

      resetProgress: () => set({ streamProgress: INITIAL_PROGRESS }),

      // ── Legacy ──────────────────────────────────────────────────────────
      isLoading: false,
      setLoading: (v) => set({ isLoading: v }),

      // ── Preferences ──────────────────────────────────────────────────────
      darkMode: false,
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
    }),
    {
      name:    'curalink-v2',
      storage: createJSONStorage(() => localStorage),
      // Only persist messages, session, and dark mode preference.
      // Streaming state is always ephemeral.
      partialize: (s) => ({
        sessionId: s.sessionId,
        messages:  s.messages.slice(-30),
        darkMode:  s.darkMode,
      }),
    }
  )
);

export const selectHasMessages   = (s: ChatState) => s.messages.length > 0;
export const selectIsBlocked     = (s: ChatState) => s.isStreaming || s.isLoading;
