import { motion } from 'framer-motion';

export default function Tabs({ items, value, onChange, layoutId = 'tabs-active', className = '' }) {
  return (
    <div className={`inline-flex flex-wrap gap-1 p-1 rounded-2xl bg-ink/10 ${className}`}>
      {items.map((item) => {
        const active = item.value === value;
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            onClick={() => onChange(item.value)}
            className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-colors
              ${active ? 'text-brand-800' : 'text-ink'}`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 bg-surface rounded-xl shadow-soft -z-10"
              />
            )}
            {Icon && <Icon size={14} className="shrink-0" />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
