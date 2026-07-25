import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center text-center py-16 px-6"
    >
      <div className="w-14 h-14 rounded-3xl bg-red-50 dark:bg-red-500/15 flex items-center justify-center mb-4 text-danger">
        <AlertCircle size={20} />
      </div>
      <p className="text-sm font-semibold text-ink mb-1">{title}</p>
      {message && <p className="text-xs text-ink-faint max-w-xs mb-4">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
        >
          <RefreshCw size={12} /> Try again
        </button>
      )}
    </motion.div>
  );
}
