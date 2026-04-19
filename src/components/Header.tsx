import { Moon, Sun, Trash2, Wifi, Github, Linkedin, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogoLockup } from './Logo';
import { Button } from './ui/button';
import { Tooltip, TooltipProvider } from './ui/tooltip';
import { useChatStore } from '@/store/chatStore';
import { useSession } from '@/features/chat/hooks/useSession';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function Header() {
  const { darkMode, toggleDarkMode, clearMessages, messages } = useChatStore();
  const { currentDisease, hasSession } = useSession();
  const hasMessages = messages.length > 0;

  const handleClear = () => {
    clearMessages();
    toast.success('Conversation cleared');
  };

  return (
    <TooltipProvider>
      <header
        className={cn(
          'sticky top-0 z-50 flex h-14 items-center justify-between gap-3',
          'px-3 sm:px-4 md:px-6',
          'border-b border-slate-200 dark:border-slate-800',
          'bg-white/90 dark:bg-slate-950/90 backdrop-blur-md shadow-sm'
        )}
        role="banner"
      >
        {/* Left: logo + context pill */}
        <div className="flex items-center gap-3 min-w-0">
          <LogoLockup />

          <AnimatePresence>
            {hasSession && currentDisease && (
              <motion.div
                initial={{ opacity: 0, x: -8, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -8, scale: 0.92 }}
                transition={{ duration: 0.2 }}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full
                           bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700/50
                           text-xs font-medium text-teal-700 dark:text-teal-300 max-w-[180px] overflow-hidden"
                aria-label={`Active context: ${currentDisease}`}
              >
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" aria-hidden="true" />
                <span className="truncate">Context: {currentDisease}</span>
              </motion.div>
            )}
            {hasSession && !currentDisease && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full
                           bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                           text-xs text-slate-500 dark:text-slate-400"
              >
                <Wifi size={11} aria-hidden="true" />
                Session active
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          {/* GitHub */}
          <Tooltip label="GitHub Repository">
            <Button
              variant="ghost"
              size="icon"
              // asChild
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <a
                href="https://github.com/Tanveer-G/Curalink-AI-Medical-Research-Assistant-Backend"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View source on GitHub"
              >
                <Github size={16} aria-hidden="true" />
              </a>
            </Button>
          </Tooltip>

          {/* LinkedIn */}
          <Tooltip label="LinkedIn Profile">
            <Button
              variant="ghost"
              size="icon"
              // asChild
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <a
                href="https://linkedin.com/in/tanveer-h1"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Connect on LinkedIn"
              >
                <Linkedin size={16} aria-hidden="true" />
              </a>
            </Button>
          </Tooltip>

          {/* Portfolio (optional – uncomment to enable) */}
          
          <Tooltip label="Portfolio Website" >
            <Button
              variant="ghost"
              size="icon"
              // asChild
              className="hidden md:block text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <a
                href="https://tanveer-portfolio.vercel.app/?utm_source=curalink&utm_medium=header-nav&utm_campaign=website-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit portfolio"
              >
                <Globe size={16} aria-hidden="true" />
              </a>
            </Button>
          </Tooltip>
         

          <Tooltip label={darkMode ? 'Light mode' : 'Dark mode'}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {darkMode ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
            </Button>
          </Tooltip>

          {hasMessages && (
            <Tooltip label="Clear conversation">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClear}
                aria-label="Clear conversation"
                className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
              >
                <Trash2 size={15} aria-hidden="true" />
              </Button>
            </Tooltip>
          )}
        </div>
      </header>
    </TooltipProvider>
  );
}