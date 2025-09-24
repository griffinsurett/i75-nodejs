// components/common/EditorHeader.jsx
import { Loader2, Save } from 'lucide-react';
import BackButton from '../navigation/BackButton';

export default function EditorHeader({
  title,
  subtitle,
  backUrl,
  backLabel = "Back",
  hasUnsavedChanges,
  saving,
  onSave,
  saveLabel = "Save All Changes",
  children, // For additional status indicators
}) {
  return (
    <div className="bg-bg border-b border-border-primary px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton 
            to={backUrl}
            confirmNavigation={true}
            confirmCondition={hasUnsavedChanges}
            confirmMessage="You have unsaved changes. Are you sure you want to leave?"
          >
            {backLabel}
          </BackButton>
          <div>
            <h1 className="text-xl font-bold text-heading">{title}</h1>
            {subtitle && (
              <p className="text-sm text-text/70">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {children}
          
          <button
            onClick={onSave}
            disabled={!hasUnsavedChanges || saving}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasUnsavedChanges && !saving
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-bg2 text-text/60 cursor-not-allowed"
            }`}
            title={hasUnsavedChanges ? "Save all changes (Ctrl+S)" : "No changes to save"}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {saveLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}