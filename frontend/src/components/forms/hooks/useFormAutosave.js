// frontend/src/hooks/useFormAutosave.js
import { useEffect, useRef, useCallback } from "react";
import { debounce } from "lodash";
import useLocalStorageState from "../../../hooks/useLocalStorageState";

export default function useFormAutosave(
  formKey,
  entityId = null,
  defaultValues = {},
  options = {}
) {
  const {
    debounceMs = 500,
    excludeFields = [],
    onRestore = null,
    enabled = true,
  } = options;

  // Generate unique storage key
  const storageKey = `form_autosave_${formKey}${
    entityId ? `_${entityId}` : "_new"
  }`;

  // Use the local storage hook with JSON mode
  const [savedData, setSavedData] = useLocalStorageState(
    storageKey,
    null,
    { raw: false, syncTabs: false } // Disable sync to prevent conflicts
  );

  // Track if we've restored data
  const hasRestored = useRef(false);

  // Save form data (no debounce here, let parent handle it)
  const saveFormData = useCallback(
    (formData) => {
      if (!enabled) return;

      console.log(`Saving to ${storageKey}:`, formData);

      // Filter out excluded fields
      const dataToSave = { ...formData };
      excludeFields.forEach((field) => {
        delete dataToSave[field];
      });

      // Add metadata
      const autosaveData = {
        data: dataToSave,
        timestamp: Date.now(),
        formKey,
        entityId,
      };

      setSavedData(autosaveData);
    },
    [enabled, excludeFields, formKey, entityId, storageKey, setSavedData]
  );

  // Restore form data
  const restoreFormData = useCallback(() => {
    if (!enabled || hasRestored.current || !savedData) return null;

    hasRestored.current = true;

    console.log(`Restoring from ${storageKey}:`, savedData);

    // Check if saved data is recent (within last 24 hours)
    const isRecent =
      savedData.timestamp &&
      Date.now() - savedData.timestamp < 24 * 60 * 60 * 1000;

    if (!isRecent) {
      clearAutosave();
      return null;
    }

    // Return the saved data
    const restoredData = savedData.data || savedData;

    if (onRestore) {
      onRestore(restoredData);
    }

    return restoredData;
  }, [enabled, savedData, onRestore]);

  // Clear autosaved data
  const clearAutosave = useCallback(() => {
    console.log(`Clearing autosave for ${storageKey}`);
    setSavedData(null);

    // Also clear from localStorage directly to ensure it's gone
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey, setSavedData]);

  // Check if autosave data exists
  const hasAutosaveData = useCallback(() => {
    return Boolean(
      savedData && (savedData.data || Object.keys(savedData).length > 0)
    );
  }, [savedData]);

  // Get autosave info
  const getAutosaveInfo = useCallback(() => {
    if (!savedData) return null;

    const timestamp = savedData.timestamp || Date.now();
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;

    // Format relative time
    let relativeTime;
    if (diff < 60000) {
      relativeTime = "Just now";
    } else if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      relativeTime = `${mins} minute${mins !== 1 ? "s" : ""} ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      relativeTime = `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(diff / 86400000);
      relativeTime = `${days} day${days !== 1 ? "s" : ""} ago`;
    }

    return {
      timestamp,
      date: date.toLocaleString(),
      relativeTime,
    };
  }, [savedData]);

  return {
    saveFormData,
    restoreFormData,
    clearAutosave,
    hasAutosaveData,
    getAutosaveInfo,
    savedData: savedData?.data || savedData || null,
  };
}