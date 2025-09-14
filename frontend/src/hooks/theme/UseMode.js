// src/hooks/theme/UseMode.js
import { useEffect } from "react";
import useLocalStorageState from "../useLocalStorageState";

/**
 * Theme hook:
 * - Sets `data-theme` and `color-scheme` on <html>
 * - Updates <meta name="theme-color"> from computed --color-bg (no manual var writes)
 * - Persists user choice; follows OS when no stored preference
 */
export function UseMode() {
  // Initial: localStorage > OS preference (dark?) > dark fallback
  const [theme, setTheme] = useLocalStorageState(
    "theme",
    () => {
      try {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      } catch {
        return "dark";
      }
    },
    { raw: true, validate: (v) => v === "light" || v === "dark" }
  );

  const isLight = theme === "light";
  const setIsLight = (val) => setTheme(val ? "light" : "dark");

  // Apply theme attributes to <html> and update theme-color meta
  useEffect(() => {
    const root = document.documentElement;
    const t = isLight ? "light" : "dark";

    // 1) reflect theme for CSS
    root.setAttribute("data-theme", t);
    root.style.colorScheme = t;

    // 2) read computed --color-bg and set meta[name="theme-color"]
    // This uses whatever your CSS currently resolves for --color-bg in this theme.
    const computed = getComputedStyle(root).getPropertyValue("--color-bg").trim();

    // ensure we have (some) value; browsers accept rgb(), hsl(), or hex
    if (computed) {
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "theme-color";
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", computed);
    }
  }, [isLight]);

  // Follow OS changes only if user hasn't explicitly saved a preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      try {
        const stored = localStorage.getItem("theme");
        // Only auto-switch when no explicit stored preference
        if (stored !== "light" && stored !== "dark") {
          setTheme(e.matches ? "dark" : "light");
        }
      } catch {}
    };
    // Modern addEventListener; fallback for older Safari
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else if (mq.addListener) mq.addListener(handler);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else if (mq.removeListener) mq.removeListener(handler);
    };
  }, [setTheme]);

  return [isLight, setIsLight];
}
