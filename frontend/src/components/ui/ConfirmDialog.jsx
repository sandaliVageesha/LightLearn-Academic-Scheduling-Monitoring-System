import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  danger = true,
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} width="max-w-sm">
      <div className="flex flex-col items-center text-center gap-3 py-2">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center
          ${danger ? 'bg-red-50 dark:bg-red-500/15 text-danger' : 'bg-amber-50 dark:bg-amber-500/15 text-warning'}`}>
          <AlertTriangle size={22} />
        </div>
        <h3 className="font-display font-semibold text-ink text-[1.05rem]">{title}</h3>
        {message && <p className="text-sm text-ink-faint leading-relaxed">{message}</p>}

        <div className="flex gap-3 w-full mt-3">
          <Button variant="outline" size="md" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={danger ? 'danger' : 'brand'}
            size="md"
            className="flex-1"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
