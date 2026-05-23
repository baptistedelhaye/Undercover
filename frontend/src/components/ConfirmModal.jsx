import { useEffect } from 'react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirmer', cancelText = 'Annuler' }) {
  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          onCancel();
        }
      };
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-200">
      <div className="mx-4 max-w-sm animate-in zoom-in-95 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-[var(--text)]">{title}</h2>
        <p className="mt-3 text-[var(--muted)]">{message}</p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--border)]/80 hover:bg-[var(--surface)]"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-full bg-red-500/80 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 hover:-translate-y-0.5"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
