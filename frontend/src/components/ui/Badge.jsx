const TONES = {
  brand:   'bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300',
  accent:  'bg-accent-50 dark:bg-accent-500/15 text-accent-700 dark:text-accent-300',
  success: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400',
  danger:  'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400',
  neutral: 'bg-ink/[0.05] text-ink-soft',
};

export default function Badge({ tone = 'neutral', dot = false, className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
        text-[11px] font-semibold tracking-wide ${TONES[tone] ?? TONES.neutral} ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
