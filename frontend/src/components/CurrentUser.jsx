// frontend/src/components/CurrentUser.jsx
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  Settings,
  Palette,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  Monitor,
  Check,
} from "lucide-react";

import { UseMode } from "../hooks/theme/UseMode";
import useLocalStorageState from "../hooks/useLocalStorageState";

/**
 * CurrentUser
 * Avatar opens a Claude-style menu that appears ABOVE the avatar.
 * Theme flyout opens on hover. “Sync with system” never shows a checkmark—
 * it just switches Light/Dark based on OS.
 * Clicking ANYWHERE outside the menu closes it.
 */
export default function CurrentUser({
  name = "Admin User",
  role = "Platform Administrator",
  email,
  avatarUrl = "",
  profileTo = "/account",
  onSignOut,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  // THEME state
  const [isLight, setIsLight] = UseMode(); // applies theme to <html> & meta
  const [themeMode, setThemeMode] = useLocalStorageState(
    "theme_mode",
    () => (isLight ? "light" : "dark"),
    { validate: (v) => v === "light" || v === "dark" || v === "system" }
  );

  const prefersDark = (() => {
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  })();
  const resolvedTheme =
    themeMode === "system" ? (prefersDark ? "dark" : "light") : themeMode;

  // Apply explicit light/dark to actual theme
  useEffect(() => {
    if (themeMode === "light") setIsLight(true);
    else if (themeMode === "dark") setIsLight(false);
  }, [themeMode, setIsLight]);

  // Follow OS only while in "system"
  useEffect(() => {
    if (themeMode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setIsLight(!mq.matches);
    apply();
    const handler = () => apply();
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else if (mq.addListener) mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else if (mq.removeListener) mq.removeListener(handler);
    };
  }, [themeMode, setIsLight]);

  // ---- Position main menu (ABOVE avatar, clamp left to 0) ----
  const positionMenu = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;

    const menuW = menuRef.current?.offsetWidth ?? 260;
    const menuH = menuRef.current?.offsetHeight ?? 440;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const preferredLeft = r.left + r.width / 2 - menuW / 2;
    const left = Math.max(0, Math.min(preferredLeft, vw - menuW));

    const aboveTop = r.top - 12 - menuH;
    const belowTop = r.bottom + 12;
    const top =
      aboveTop >= 12 ? aboveTop : Math.min(belowTop, vh - menuH - 12);

    setPos({ top, left });
  };

  useEffect(() => {
    if (!open) return;
    positionMenu();
    const id = requestAnimationFrame(positionMenu);

    const onResizeScroll = () => positionMenu();
    const onKey = (e) => e.key === "Escape" && setOpen(false);

    window.addEventListener("resize", onResizeScroll);
    window.addEventListener("scroll", onResizeScroll, true);
    document.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", onResizeScroll);
      window.removeEventListener("scroll", onResizeScroll, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // ---- Theme submenu (opens on hover) ----
  const [themeOpen, setThemeOpen] = useState(false);
  const themeBtnRef = useRef(null);
  const themeRef = useRef(null);
  const [themePos, setThemePos] = useState({ top: 0, left: 0 });
  const hoverTimer = useRef(null);
  const HOVER_CLOSE_DELAY = 180; // ms

  const clearHoverTimer = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const scheduleClose = () => {
    clearHoverTimer();
    hoverTimer.current = setTimeout(() => setThemeOpen(false), HOVER_CLOSE_DELAY);
  };

  const positionTheme = () => {
    const anchor = themeBtnRef.current?.getBoundingClientRect();
    const mainMenu = menuRef.current?.getBoundingClientRect();
    if (!anchor || !mainMenu) return;

    const w = themeRef.current?.offsetWidth ?? 260;
    const h = themeRef.current?.offsetHeight ?? 220;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const preferredLeft = mainMenu.right + 12;
    const left = Math.min(preferredLeft, vw - w - 12);

    const preferredTop = anchor.top - 12;
    const top = Math.max(12, Math.min(preferredTop, vh - h - 12));
    setThemePos({ top, left });
  };

  useEffect(() => {
    if (!themeOpen) return;
    positionTheme();
    const id = requestAnimationFrame(positionTheme);
    const handle = () => positionTheme();
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, true);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, true);
    };
  }, [themeOpen]);

  const initials = getInitials(name);

  const avatarEl = avatarUrl ? (
    <img
      src={avatarUrl}
      alt={`${name} avatar`}
      className="w-10 h-10 rounded-full object-cover border border-border-primary"
    />
  ) : (
    <div className="w-10 h-10 rounded-full bg-text/10 text-heading flex items-center justify-center font-semibold">
      {initials}
    </div>
  );

  const closeAll = () => {
    setThemeOpen(false);
    setOpen(false);
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-xl cursor-pointer px-3 py-2 transition-colors ${
        open ? "bg-bg2" : "hover:bg-bg2"
      } ${className}`}
      role="button"
      aria-expanded={open}
      tabIndex={0}
      onClick={() => {
        setOpen((v) => !v);
        setThemeOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen((v) => !v);
          setThemeOpen(false);
        }
      }}
    >
      {/* Anchor for positioning (non-button element) */}
      <div
        ref={btnRef}
        className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {avatarEl}
      </div>

      {/* Meta (static text) */}
      <div className="min-w-0">
        <div className="text-base font-semibold text-heading truncate">{name}</div>
        <div className="text-xs text-text truncate">{role || email || "—"}</div>
      </div>

      {/* Menus (portaled so they can overflow nicely) */}
      {open &&
        createPortal(
          <>
            {/* Transparent click-catcher: clicking anywhere outside closes */}
            <div
              className="fixed inset-0 z-40"
              onMouseDown={closeAll}
              onClick={closeAll}
            />

            {/* Main menu */}
            <div
              ref={menuRef}
              role="menu"
              className="fixed z-50 w-[260px] max-w-[calc(100vw)] rounded-2xl bg-bg border border-border-primary shadow-2xl overflow-hidden"
              style={{ top: pos.top, left: pos.left }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header / account row */}
              <div className="px-4 py-3">
                <div className="text-xs font-semibold text-text/80 uppercase tracking-wider mb-2">
                  Accounts
                </div>
                <Row asLink={!!profileTo} to={profileTo} onClick={closeAll}>
                  <div className="flex items-center gap-3">
                    {avatarEl}
                    <div className="min-w-0">
                      <div className="font-semibold text-heading truncate">{name}</div>
                      <div className="text-sm text-text truncate">{email || role}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text/70" />
                </Row>
              </div>

              <Divider />

              {/* Actions */}
              <div className="p-2">
                <Row
                  asLink={!!profileTo}
                  to={profileTo}
                  onClick={closeAll}
                  icon={Settings}
                  label="Settings"
                />

                {/* Theme row — hover to open */}
                <div
                  ref={themeBtnRef}
                  role="menuitem"
                  aria-haspopup="menu"
                  aria-expanded={themeOpen}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm hover:bg-bg2 text-heading cursor-pointer"
                  onMouseEnter={() => {
                    clearHoverTimer();
                    if (!themeOpen) setThemeOpen(true);
                    setTimeout(positionTheme, 0);
                  }}
                  onMouseLeave={scheduleClose}
                  onFocus={() => {
                    clearHoverTimer();
                    setThemeOpen(true);
                    setTimeout(positionTheme, 0);
                  }}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Palette className="w-4 h-4 text-text" />
                    <span className="truncate">Theme</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-text/70" />
                </div>
              </div>

              <Divider />

              <div className="p-2">
                <Row
                  icon={LogOut}
                  label="Log out"
                  danger
                  onClick={() => {
                    closeAll();
                    onSignOut?.();
                  }}
                />
              </div>
            </div>

            {/* Theme submenu (fly-out) */}
            {themeOpen && (
              <div
                ref={themeRef}
                className="fixed z-60 w-[260px] max-w-[calc(100vw-24px)] rounded-2xl bg-bg border border-border-primary shadow-2xl overflow-hidden"
                style={{ top: themePos.top, left: themePos.left }}
                onMouseEnter={clearHoverTimer}
                onMouseLeave={scheduleClose}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-2 flex items-center gap-2 border-b border-border-primary">
                  <button
                    type="button"
                    aria-label="Back"
                    className="p-1 rounded hover:bg-bg2"
                    onClick={() => setThemeOpen(false)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="text-sm font-semibold text-heading">Theme</div>
                </div>

                <div className="p-2">
                  <ThemeOption
                    icon={Sun}
                    label="Light"
                    selected={resolvedTheme === "light"}
                    badge={themeMode === "system" && resolvedTheme === "light" ? "Auto" : undefined}
                    onClick={() => {
                      setThemeMode("light");
                      setThemeOpen(false);
                      closeAll(); // also close parent menu
                    }}
                  />
                  <ThemeOption
                    icon={Moon}
                    label="Dark"
                    selected={resolvedTheme === "dark"}
                    badge={themeMode === "system" && resolvedTheme === "dark" ? "Auto" : undefined}
                    onClick={() => {
                      setThemeMode("dark");
                      setThemeOpen(false);
                      closeAll(); // also close parent menu
                    }}
                  />
                  <ThemeOption
                    icon={Monitor}
                    label="Sync with system"
                    note="Switches automatically with your OS"
                    selected={false} // never checked
                    onClick={() => {
                      setThemeMode("system");
                      setThemeOpen(false);
                      closeAll(); // also close parent menu
                    }}
                  />
                </div>
              </div>
            )}
          </>,
          document.body
        )}
    </div>
  );
}

function Row({
  asLink,
  to = "#",
  icon: Icon,
  label,
  right,
  danger = false,
  children,
  onClick,
}) {
  const cls =
    "flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors " +
    (danger ? "text-red-600 hover:bg-bg2" : "hover:bg-bg2 text-heading");

  const inner = (
    <>
      <div className="flex items-center gap-3 min-w-0">
        {children ? (
          children
        ) : Icon ? (
          <>
            <Icon className="w-4 h-4 text-text" />
            <span className="truncate">{label}</span>
          </>
        ) : (
          <span className="truncate">{label}</span>
        )}
      </div>
      {right}
    </>
  );

  if (asLink) {
    return (
      <Link to={to} onClick={onClick} className={cls} role="menuitem">
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} role="menuitem">
      {inner}
    </button>
  );
}

function ThemeOption({ icon: Icon, label, note, selected, onClick, badge }) {
  return (
    <button
      type="button"
      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-bg2 text-heading transition-colors"
      onClick={onClick}
      role="menuitemradio"
      aria-checked={selected}
    >
      <span className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-text" />
        <span className="text-left">
          <span className="block flex items-center gap-2">
            {label}
            {badge && (
              <span className="px-1.5 py-0.5 text-xs rounded bg-bg2 text-text/80 border border-border-primary">
                {badge}
              </span>
            )}
          </span>
          {note && <span className="block text-xs text-text/70">{note}</span>}
        </span>
      </span>
      {selected && <Check className="w-4 h-4 text-text/80" />}
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-border-primary/70 mx-2" />;
}

function getInitials(fullName = "") {
  const parts = fullName.trim().split(/\s+/).slice(0, 2);
  if (!parts.length) return "A";
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "A";
}
