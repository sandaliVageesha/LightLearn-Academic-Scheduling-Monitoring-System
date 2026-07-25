import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const TONES = {
  brand:   { bg: 'bg-brand-50/60 dark:bg-brand-500/10',     icon: 'bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300',     val: 'text-brand-800 dark:text-brand-200',   bar: 'bg-brand-500'   },
  accent:  { bg: 'bg-accent-50/60 dark:bg-accent-500/10',   icon: 'bg-accent-100 dark:bg-accent-500/20 text-accent-700 dark:text-accent-300',   val: 'text-accent-800 dark:text-accent-200',  bar: 'bg-accent-500'  },
  success: { bg: 'bg-emerald-50/60 dark:bg-emerald-500/10', icon: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300', val: 'text-emerald-800 dark:text-emerald-200', bar: 'bg-emerald-500' },
  warning: { bg: 'bg-amber-50/60 dark:bg-amber-500/10',     icon: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',     val: 'text-amber-800 dark:text-amber-200',   bar: 'bg-amber-500'   },
  danger:  { bg: 'bg-red-50/60 dark:bg-red-500/10',         icon: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300',         val: 'text-red-800 dark:text-red-200',     bar: 'bg-red-500'     },
  violet:  { bg: 'bg-violet-50/60 dark:bg-violet-500/10',   icon: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300',   val: 'text-violet-800 dark:text-violet-200',  bar: 'bg-violet-500'  },
  ocean:   { bg: 'bg-ocean-50/60 dark:bg-ocean-500/10',     icon: 'bg-ocean-100 dark:bg-ocean-500/20 text-ocean-800 dark:text-ocean-300',     val: 'text-ocean-900 dark:text-ocean-200',   bar: 'bg-ocean-600'   },
};

export default function StatCard({
  label,
  value,
  tone = 'brand',
  color,
  icon: Icon,
  progress,       // optional 0-100
  progressLabel,  // optional caption under the bar
  trend,          // optional { value: '+12%', direction: 'up' | 'down' }
}) {
  const t = TONES[tone] ?? TONES[color] ?? TONES.brand;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      className={`rounded-3xl border border-white/60 dark:border-white/10 backdrop-blur-xl shadow-glass p-7 flex flex-col gap-3 ${t.bg}`}
    >
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${t.icon}`}>
            <Icon size={24} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`text-3xl font-display font-bold leading-none ${t.val}`}>{value ?? '—'}</p>
            {trend && (
              <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
                trend.direction === 'down' ? 'text-danger' : 'text-success'
              }`}>
                {trend.direction === 'down' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                {trend.value}
              </span>
            )}
          </div>
          <p className="text-sm text-ink-faint font-medium mt-2 truncate">{label}</p>
        </div>
      </div>

      {typeof progress === 'number' && (
        <div>
          <div className="h-1.5 rounded-full bg-surface/70 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full rounded-full ${t.bar}`}
            />
          </div>
          {progressLabel && (
            <p className="text-[10px] text-ink-faint mt-1">{progressLabel}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
