import Modal from './Modal';

/**
 * Lightweight confirmation dialog wrapper around Modal.
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  busy = false,
  error = '',
  confirmClass = 'bg-primary',
}) {
  return (
    <Modal isOpen={isOpen} onClose={busy ? () => {} : onClose}>
      <div className="p-4 min-w-80">
        <h3 className="text-lg font-semibold text-heading mb-2">{title}</h3>
        {description && <p className="text-sm text-text mb-4">{description}</p>}
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm rounded-lg border border-border-primary text-text hover:bg-bg2"
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-3 py-2 text-sm rounded-lg text-white ${confirmClass} hover:opacity-90 disabled:opacity-50`}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
