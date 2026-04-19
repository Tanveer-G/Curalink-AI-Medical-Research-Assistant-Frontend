import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function generateId(): string { return `${Date.now()}-${Math.random().toString(36).slice(2,9)}`; }
export function formatMs(ms: number): string { return ms < 1000 ? `${ms}ms` : `${(ms/1000).toFixed(1)}s`; }
export function formatNumber(n: number): string { return n.toLocaleString(); }

export function getStatusKey(status: string): 'recruiting'|'completed'|'active'|'terminated'|'unknown' {
  const s = status.toLowerCase();
  if (s.includes('recruit'))  return 'recruiting';
  if (s.includes('complet'))  return 'completed';
  if (s.includes('active') || s.includes('ongoing')) return 'active';
  if (s.includes('terminat') || s.includes('withdraw')) return 'terminated';
  return 'unknown';
}

export function truncate(str: string, len: number): string {
  return str.length <= len ? str : str.slice(0, len).trimEnd() + '…';
}

export function extractDisease(messages: import('@/types').Message[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === 'assistant' && msg.data.conditionOverview?.length > 0) {
      const first = msg.data.conditionOverview.split('.')[0];
      const match = first.match(/\b[A-Z][a-zA-Z]+(?: [A-Za-z]+)?\b/);
      return match ? match[0] : null;
    }
  }
  return null;
}

export function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  if (d < 60000) return 'just now';
  if (d < 3600000) return `${Math.floor(d/60000)}m ago`;
  return `${Math.floor(d/3600000)}h ago`;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function downloadText(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function responseToText(data: import('@/types').ResponseData, query: string): string {
  return [
    'Curalink Research Report', `Query: ${query}`, `Generated: ${new Date().toLocaleString()}`, '',
    'CONDITION OVERVIEW', '==================', data.conditionOverview, '',
    'RESEARCH INSIGHTS',  '=================',
    ...data.researchInsights.map((ins, i) =>
      `${i+1}. ${ins.finding}\n   Source: ${ins.citationId}\n   Snippet: "${ins.snippet}"`),
    '', 'CLINICAL TRIALS', '===============',
    ...(data.clinicalTrials.length
      ? data.clinicalTrials.map(t => `• ${t.title} [${t.nctId}]\n  Status: ${t.status}\n  ${t.url}`)
      : ['No clinical trials found.']),
    '', 'DISCLAIMER', '==========', data.disclaimer,
  ].join('\n');
}
