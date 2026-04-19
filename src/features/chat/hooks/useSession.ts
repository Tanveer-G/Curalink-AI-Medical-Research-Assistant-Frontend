import { useChatStore } from '@/store/chatStore';
import { extractDisease } from '@/lib/utils';

export function useSession() {
  const { sessionId, messages, clearSession } = useChatStore();
  return {
    sessionId,
    currentDisease: extractDisease(messages),
    hasSession: !!sessionId,
    messageCount: messages.length,
    clearSession,
  };
}
