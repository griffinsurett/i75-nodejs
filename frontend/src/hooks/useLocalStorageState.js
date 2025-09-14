// src/hooks/useLocalStorageState.js
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A minimal, SSR-safe localStorage-backed state hook.
 *
 * Features:
 * - Synchronous initial value (reads LS once; falls back to `initialValue`)
 * - Optional validator to reject bad values
 * - Optional JSON mode (default is raw string/primitive storage)
 * - Cross-tab sync via "storage" events
 */
export default function useLocalStorageState(
  key,
  initialValue,
  {
    // Store raw string/primitive by default. Set to false to JSON encode/decode.
    raw = true,
    // Validate values before committing them (return true if ok).
    validate,
    // Sync this state when another tab changes the same key.
    syncTabs = true,
    // Custom (de)serializers if you need them.
    serialize = raw ? (v) => String(v) : (v) => JSON.stringify(v),
    deserialize = raw ? (v) => v : (v) => JSON.parse(v),
  } = {}
) {
  const initialRef = useRef(initialValue);

  const getInitial = useCallback(() => {
    // SSR guard
    if (typeof window === "undefined") {
      return typeof initialRef.current === "function"
        ? initialRef.current()
        : initialRef.current;
    }
    try {
      const rawVal = window.localStorage.getItem(key);
      if (rawVal != null) {
        const parsed = deserialize(rawVal);
        if (!validate || validate(parsed)) return parsed;
      }
    } catch {}
    return typeof initialRef.current === "function"
      ? initialRef.current()
      : initialRef.current;
  }, [key, deserialize, validate]);

  const [value, setValue] = useState(getInitial);

  // Persist on change
  useEffect(() => {
    try {
      // Validate before writing
      if (validate && !validate(value)) return;
      window.localStorage.setItem(key, serialize(value));
    } catch {}
  }, [key, value, serialize, validate]);

  // Cross-tab sync
  useEffect(() => {
    if (!syncTabs || typeof window === "undefined") return;

    const onStorage = (e) => {
      if (e.storageArea !== window.localStorage) return;
      if (e.key !== key) return;
      try {
        if (e.newValue == null) return; // ignore removals
        const next = deserialize(e.newValue);
        if (!validate || validate(next)) setValue(next);
      } catch {}
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, deserialize, validate, syncTabs]);

  return [value, setValue];
}
