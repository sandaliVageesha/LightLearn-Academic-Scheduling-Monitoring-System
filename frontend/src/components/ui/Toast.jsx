import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const TONES = {
  success: 'bg-surface border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 [&_svg]:text-success',
  error:   'bg-surface border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 [&_svg]:text-danger',
  info:    'bg-surface border-brand-200 dark:border-brand-500/30 text-brand-700 dark:text-brand-300 [&_svg]:text-brand-600',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback((message, type = 'success', duration = 3200) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => remove(id), duration);
  }, [remove]);

  const toast = useMemo(() => ({
    success: (msg) => show(msg, 'success'),
    error: (msg) => show(msg, 'error'),
    info: (msg) => show(msg, 'info'),
  }), [show]);

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2 w-[min(360px,90vw)]">
        <AnimatePresence>
          {toasts.map(({ id, message, type }) => {
            const Icon = ICONS[type] ?? Info;
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border shadow-lift text-sm font-medium ${TONES[type]}`}
              >
                <Icon size={17} className="shrink-0 mt-0.5" />
                <span className="flex-1 text-ink">{message}</span>
                <button
                  onClick={() => remove(id)}
                  className="text-ink-faint hover:text-ink transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
