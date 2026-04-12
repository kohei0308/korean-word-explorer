import { X, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  loading: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  loading,
  destructive = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-modal-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-stone-800 mb-3">{title}</h3>
        <p className="text-sm text-stone-600 leading-relaxed mb-6">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
              destructive
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : 'bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500 text-white'
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
