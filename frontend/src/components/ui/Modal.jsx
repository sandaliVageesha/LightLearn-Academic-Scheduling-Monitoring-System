import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, width = 'max-w-lg', footer }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={`relative w-full ${width} bg-surface/80 backdrop-blur-2xl rounded-3xl shadow-glass
              border border-white/60 dark:border-white/10 max-h-[88vh] flex flex-col overflow-hidden`}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-ink/[0.06] shrink-0">
                <h3 className="font-display font-semibold text-ink text-[1.05rem]">{title}</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-ink-faint
                             hover:text-ink hover:bg-ink/[0.05] transition-colors"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="overflow-y-auto scroll-thin px-6 py-5">{children}</div>

            {footer && (
              <div className="px-6 py-4 border-t border-ink/[0.06] shrink-0 flex justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
