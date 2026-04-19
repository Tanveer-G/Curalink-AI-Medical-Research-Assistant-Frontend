import * as React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'teal' | 'indigo' | 'amber' | 'emerald' | 'red' | 'slate';
}

const variants = {
  teal:    'bg-teal-50   text-teal-700   border-teal-200   dark:bg-teal-900/30   dark:text-teal-300   dark:border-teal-700/50',
  indigo:  'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700/50',
  amber:   'bg-amber-50  text-amber-700  border-amber-200  dark:bg-amber-900/30  dark:text-amber-300  dark:border-amber-700/50',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50',
  red:     'bg-red-50    text-red-700    border-red-200    dark:bg-red-900/30    dark:text-red-300    dark:border-red-700/50',
  slate:   'bg-slate-50  text-slate-600  border-slate-200  dark:bg-slate-800     dark:text-slate-400  dark:border-slate-700',
};

export function Badge({ className, variant = 'slate', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium leading-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
