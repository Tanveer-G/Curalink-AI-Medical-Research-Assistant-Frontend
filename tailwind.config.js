/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        teal: {
          50:  '#F0FDFA', 100: '#CCFBF1', 200: '#99F6E4',
          300: '#5EEAD4', 400: '#2DD4BF', 500: '#14B8A6',
          600: '#0D9488', 700: '#0F766E', 800: '#115E59', 900: '#134E4A',
        },
        slate: {
          50:  '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0',
          300: '#CBD5E1', 400: '#94A3B8', 500: '#64748B',
          600: '#475569', 700: '#334155', 800: '#1E293B', 900: '#0F172A', 950: '#020617',
        },
        emerald: { 50:'#ECFDF5',100:'#D1FAE5',600:'#059669',700:'#047857' },
        amber:   { 50:'#FFFBEB',100:'#FEF3C7',600:'#D97706',700:'#B45309' },
        red:     { 50:'#FEF2F2',100:'#FEE2E2',600:'#DC2626',700:'#B91C1C' },
        indigo:  { 50:'#EEF2FF',100:'#E0E7FF',600:'#4F46E5',700:'#4338CA' },
      },
      boxShadow: {
        card: '0 0 0 1px rgb(0 0 0/0.05),0 4px 16px rgb(0 0 0/0.07)',
        'card-hover': '0 0 0 1px rgb(0 0 0/0.08),0 8px 24px rgb(0 0 0/0.12)',
      },
      animation: {
        'fade-in':   'fadeIn 0.25s ease-out',
        'slide-up':  'slideUp 0.3s ease-out',
        'scale-in':  'scaleIn 0.2s ease-out',
        'shimmer':   'shimmer 2s linear infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { from:{opacity:'0'},to:{opacity:'1'} },
        slideUp:  { from:{opacity:'0',transform:'translateY(8px)'},to:{opacity:'1',transform:'translateY(0)'} },
        scaleIn:  { from:{opacity:'0',transform:'scale(0.95)'},to:{opacity:'1',transform:'scale(1)'} },
        shimmer:  { from:{backgroundPosition:'-200% 0'},to:{backgroundPosition:'200% 0'} },
        pulseDot: { '0%,100%':{opacity:'1',transform:'scale(1)'},'50%':{opacity:'0.5',transform:'scale(0.85)'} },
      },
    },
  },
  plugins: [],
}
