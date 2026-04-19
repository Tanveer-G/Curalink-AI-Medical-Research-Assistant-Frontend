export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export const EXAMPLE_QUERIES = [
  { text: 'Can vitamin D supplementation reduce lung cancer risk?', icon: '☀️', tag: 'Prevention' },
  { text: 'Latest treatments for Type 2 Diabetes Mellitus', icon: '💉', tag: 'Treatment' },
  { text: 'How does gut microbiome affect Alzheimer\'s disease?', icon: '🧠', tag: 'Research' },
  { text: 'Clinical trials for metastatic breast cancer in India', icon: '🔬', tag: 'Trials' },
  { text: 'Risk factors for hypertension in young adults', icon: '❤️', tag: 'Causes' },
  { text: 'Prognosis of stage 3 colorectal cancer with immunotherapy', icon: '📊', tag: 'Prognosis' },
] as const;

export const SOURCE_CONFIG = {
  PubMed:         { color: 'text-teal-700',   bg: 'bg-teal-50',   border: 'border-teal-200',   dot: '#0F766E' },
  OpenAlex:       { color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', dot: '#4338CA' },
  ClinicalTrials: { color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200',  dot: '#B45309' },
} as const;

export const STATUS_CONFIG = {
  recruiting: { label: 'Recruiting',  dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  completed:  { label: 'Completed',   dot: 'bg-indigo-500',  badge: 'bg-indigo-50  text-indigo-700  border-indigo-200'  },
  active:     { label: 'Active',      dot: 'bg-amber-500',   badge: 'bg-amber-50   text-amber-700   border-amber-200'   },
  terminated: { label: 'Terminated',  dot: 'bg-red-500',     badge: 'bg-red-50     text-red-700     border-red-200'     },
  unknown:    { label: 'Unknown',     dot: 'bg-slate-400',   badge: 'bg-slate-50   text-slate-600   border-slate-200'   },
} as const;

export const APP_NAME    = 'Curalink';
export const APP_TAGLINE = 'Evidence-based medical research, synthesised by AI';
