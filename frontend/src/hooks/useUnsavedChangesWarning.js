// hooks/useUnsavedChangesWarning.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function useUnsavedChangesWarning(hasUnsavedChanges, saving = false) {
  const location = useLocation();

  // Browser navigation warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges && !saving) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, saving]);

  // React Router navigation warning
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleLocationChange = (e) => {
      if (hasUnsavedChanges && !saving) {
        const confirmLeave = window.confirm(
          "You have unsaved changes. Are you sure you want to leave?"
        );
        if (!confirmLeave) {
          e.preventDefault();
          window.history.pushState(null, "", location.pathname);
        }
      }
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, [hasUnsavedChanges, saving, location.pathname]);
}