import { useState } from "react";

/**
 * Generic archive/restore/delete state machine.
 * Pass in API functions and an onSuccess refresher.
 */
export default function useArchive({ archiveFn, restoreFn, deleteFn, onSuccess }) {
  const [state, set] = useState({ type: null, open: false, busy: false, error: "" });

  const openArchive = () => set({ type: "archive", open: true, busy: false, error: "" });
  const openDelete  = () => set({ type: "delete",  open: true, busy: false, error: "" });
  const close       = () => set({ type: null, open: false, busy: false, error: "" });

  const toggleArchive = async (id, isArchived) => {
    set(s => ({ ...s, busy: true, error: "" }));
    try {
      if (isArchived) await restoreFn(id);
      else await archiveFn(id);
      close();
      onSuccess?.();
    } catch (e) {
      set(s => ({ ...s, busy: false, error: e?.response?.data?.message || "Action failed" }));
    }
  };

  const hardDelete = async (id) => {
    set(s => ({ ...s, busy: true, error: "" }));
    try {
      await deleteFn(id);      // in your backend this schedules + purges later
      close();
      onSuccess?.();
    } catch (e) {
      set(s => ({ ...s, busy: false, error: e?.response?.data?.message || "Failed to delete" }));
    }
  };

  return { state, openArchive, openDelete, close, toggleArchive, hardDelete };
}
