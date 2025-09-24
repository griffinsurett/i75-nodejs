// components/common/SaveStatusIndicator.jsx
import { Loader2, Check, Save } from 'lucide-react';

export default function SaveStatusIndicator({ 
  saving, 
  saveSuccess, 
  hasUnsavedChanges, 
  error,
  restoringText = null 
}) {
  return (
    <>
      {restoringText && (
        <div className="flex items-center gap-2 text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">{restoringText}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-2 text-green-600 animate-fade-in">
          <Check className="w-4 h-4" />
          <span className="text-sm">Saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm max-w-xs truncate" title={error}>
          {error}
        </div>
      )}

      {hasUnsavedChanges && !saveSuccess && (
        <div className="flex items-center gap-2 text-orange-600">
          <Save className="w-4 h-4" />
          <span className="text-sm">Unsaved changes</span>
        </div>
      )}
    </>
  );
}