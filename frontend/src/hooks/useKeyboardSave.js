// hooks/useKeyboardSave.js
import { useEffect } from 'react';

export default function useKeyboardSave(onSave, canSave = true) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (canSave && onSave) {
          onSave();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [canSave, onSave]);
}