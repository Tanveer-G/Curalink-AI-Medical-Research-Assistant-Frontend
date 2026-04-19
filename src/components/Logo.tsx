interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background rounded square */}
      <rect width="32" height="32" rx="8" fill="#0F766E" />

      {/* Document base */}
      <rect x="8" y="6" width="14" height="18" rx="2" fill="white" fillOpacity="0.15" />
      <rect x="8" y="6" width="14" height="18" rx="2" stroke="white" strokeOpacity="0.5" strokeWidth="1" />

      {/* Document lines */}
      <line x1="11" y1="12" x2="19" y2="12" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="11" y1="15" x2="17" y2="15" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="11" y1="18" x2="18" y2="18" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" />

      {/* Medical cross — top right of document */}
      <rect x="17" y="7" width="6" height="2" rx="1" fill="white" fillOpacity="0.9" />
      <rect x="19" y="5" width="2" height="6" rx="1" fill="white" fillOpacity="0.9" />

      {/* Amber accent dot — search/magnify motif */}
      <circle cx="24.5" cy="24.5" r="5" fill="#D97706" />
      <circle cx="23.5" cy="23.5" r="2.5" stroke="white" strokeWidth="1.2" fill="none" />
      <line x1="25.5" y1="25.5" x2="27.5" y2="27.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** Text lockup: logo + wordmark */
export function LogoLockup({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <Logo size={32} />
      <div>
        <div className="font-semibold text-slate-800 dark:text-slate-100 text-base leading-none tracking-tight">
          Curalink
        </div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-0.5 tracking-wide">
          Medical Research AI
        </div>
      </div>
    </div>
  );
}
