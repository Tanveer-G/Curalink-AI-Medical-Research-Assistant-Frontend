import { useEffect } from 'react';
import { Header } from './Header';
import { MessageList } from '@/features/chat/components/MessageList';
import { ChatInput } from '@/features/chat/components/ChatInput';
import { WelcomeScreen } from './WelcomeScreen';
import { useChatStore } from '@/store/chatStore';

export function Layout() {
  const { messages, darkMode } = useChatStore();
  const hasMessages = messages.length > 0;

  /* Sync dark mode class on <html> */
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else          root.classList.remove('dark');
  }, [darkMode]);

  return (
    <>
      {/* Skip to main content — WCAG 2.1 ── */}
      <a
        href="#message-feed"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]
                   focus:rounded-lg focus:bg-teal-700 focus:text-white focus:px-4 focus:py-2
                   focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to main content
      </a>

      <div className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
        <Header />

        {/* Chat area — constrained width on large screens */}
        <div className="flex-1 flex flex-col overflow-hidden max-w-4xl w-full mx-auto">
          {hasMessages ? <MessageList /> : <WelcomeScreen />}
        </div>

        {/* Input — full width, constrained inner */}
        <div className="max-w-4xl w-full mx-auto flex-shrink-0 safe-bottom">
          <ChatInput />
        </div>

        {/* Footer */}
        <footer
          className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800
                     bg-white dark:bg-slate-950
                     px-4 py-1.5 text-center"
        >
          <p className="text-[10px] text-slate-400 dark:text-slate-600">
            Curalink · AI Medical Research Assistant · For informational purposes only
          </p>
        </footer>
      </div>
    </>
  );
}
