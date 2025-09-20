export function FormActions({
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel,
  isSubmitting,
  canSubmit = true,
  className = '',
}) {
  return (
    <div className={`flex items-center justify-end gap-2 pt-2 ${className}`}>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-3 py-2 text-sm rounded-lg border border-border-primary text-text hover:bg-bg2 disabled:opacity-50"
        >
          {cancelLabel}
        </button>
      )}
      
      <button
        type="submit"
        disabled={!canSubmit || isSubmitting}
        className="px-3 py-2 text-sm rounded-lg text-white bg-primary hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </div>
  );
}