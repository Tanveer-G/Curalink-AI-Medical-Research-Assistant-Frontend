/**
 * useChatMutation.ts
 *
 * Legacy compatibility shim — now delegates to useStreamQuery so all
 * components that call `sendMessage()` automatically get SSE streaming.
 *
 * Components that previously used `useChatMutation` continue to work
 * unchanged; streaming is transparent.
 */
import { useStreamQuery } from '@/hooks/useStreamQuery';

export function useChatMutation() {
  const { sendQuery, isStreaming } = useStreamQuery();
  return {
    /** Alias kept for backward compatibility with existing components. */
    sendMessage: sendQuery,
    isPending:   isStreaming,
  };
}
