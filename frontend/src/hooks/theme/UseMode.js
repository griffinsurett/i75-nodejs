// src/hooks/theme/UseMode.js
import { useEffect, useRef, useState } from "react";
import useLocalStorageState from "../useLocalStorageState";

/**
 * Tri-state theme: 'light' | 'dark' | 'system'
 * - Applies [data-theme] & color-scheme to <html>
 * - Keeps <meta name="theme-color"> in sync with computed --color-bg
 * - Follows OS when mode === 'system'
 *
 * Returns: [mode, setMode, resolved]
 *   mode: 'light' | 'dark' | 'system' (user preference)
 *   setMode(next) -> void
 *   resolved: 'light' | 'dark' (effective theme after resolving 'system')
 */
export function useThemeMode() {
  const mqRef = useRef(
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null
  );

  const [mode, setMode] = useLocalStorageState(
    "theme",
    "system",
    { raw: true, validate: (v) => v === "light" || v === "dark" || v === "system" }
  );

  const [resolved, setResolved] = useState(() => {
    const prefersDark = mqRef.current?.matches ?? true;
    return mode === "system" ? (prefersDark ? "dark" : "light") : mode;
  });

  // Apply attributes & meta when mode or OS changes
  useEffect(() => {
    const mq = mqRef.current;
    const apply = (pref) => {
      const isDark =
        pref === "system" ? (mq?.matches ?? true) : pref === "dark";
      const effective = isDark ? "dark" : "light";
      setResolved(effective);

      const root = document.documentElement;
      root.setAttribute("data-theme", effective);
      root.style.colorScheme = effective;

      const bg = getComputedStyle(root).getPropertyValue("--color-bg").trim();
      if (bg) {
        let meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
          meta = document.createElement("meta");
          meta.name = "theme-color";
          document.head.appendChild(meta);
        }
        meta.setAttribute("content", bg);
      }
    };

    apply(mode);

    const onChange = () => mode === "system" && apply("system");
    if (mq?.addEventListener) mq.addEventListener("change", onChange);
    else if (mq?.addListener) mq.addListener(onChange);

    return () => {
      if (mq?.removeEventListener) mq.removeEventListener("change", onChange);
      else if (mq?.removeListener) mq.removeListener(onChange);
    };
  }, [mode]);

  return [mode, setMode, resolved];
}

/**
 * Back-compat wrapper used by ThemeToggle:
 * Returns [isLight, setIsLight(boolean)].
 */
export function UseMode() {
  const [mode, setMode, resolved] = useThemeMode();
  return [
    resolved === "light",
    (nextBool) => setMode(nextBool ? "light" : "dark"),
  ];
}
