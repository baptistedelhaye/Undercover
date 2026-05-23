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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xl px-4 py-6">
      <div className="w-full max-w-[90vw] animate-in zoom-in-95 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl sm:px-8 sm:py-8">
        <h2 className="text-2xl font-bold text-[var(--text)]">{title}</h2>
        <p className="mt-4 text-base leading-7 text-[var(--muted)]">{message}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onCancel}
            className="w-full rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-4 text-lg font-semibold text-[var(--text)] transition hover:bg-[var(--surface)]"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="w-full rounded-full bg-red-500/80 px-4 py-4 text-lg font-semibold text-white transition hover:bg-red-600 hover:-translate-y-0.5"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
