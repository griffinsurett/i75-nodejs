// frontend/src/components/form/AutosaveNotification.jsx
import { useEffect, useState } from 'react';
import { Save, X, RotateCcw, Check } from 'lucide-react';

export default function AutosaveNotification({ 
  autosaveInfo, 
  onRestore, 
  onDiscard,
  showStatus = true,
  lastSaved = null 
}) {
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (autosaveInfo && !showRestorePrompt) {
      setShowRestorePrompt(true);
    }
  }, [autosaveInfo]);

  useEffect(() => {
    if (lastSaved) {
      setStatus('saved');
      const timer = setTimeout(() => setStatus(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastSaved]);

  if (showRestorePrompt && autosaveInfo) {
    return (
      <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <RotateCcw className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-heading">Restore previous work?</p>
              <p className="text-sm text-text/70 mt-1">
                You have unsaved changes from {autosaveInfo.relativeTime}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onRestore();
                setShowRestorePrompt(false);
              }}
              className="px-3 py-1.5 bg-primary text-white rounded-md text-sm hover:bg-primary/90"
            >
              Restore
            </button>
            <button
              type="button"
              onClick={() => {
                onDiscard();
                setShowRestorePrompt(false);
              }}
              className="px-3 py-1.5 border border-border-primary rounded-md text-sm hover:bg-bg2"
            >
              Discard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showStatus && status === 'saved') {
    return (
      <div className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg animate-fade-in">
        <Check className="w-4 h-4" />
        <span className="text-sm">Autosaved</span>
      </div>
    );
  }

  return null;
}