// frontend/src/components/UserMenu.jsx
import { useEffect, useRef, useState } from "react";
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

import Modal from "../Modal";
import UserElement from "./UserElement";
import { UseMode } from "../../hooks/theme/UseMode";
import useLocalStorageState from "../../hooks/useLocalStorageState";

/**
 * UserMenu (reusable)
 * Anchored, Claude-style popover menu inside a Modal with transparent overlay.
 */
export default function UserMenu({
  open,
  anchorRef,
  onClose,
  name = "Admin User",
  role = "Platform Administrator",
  email,
  avatarUrl = "",
  profileTo = "/account",
  onSignOut,
  menuItems,
}) {
  const menuRef = useRef(null);

  // THEME state
  const [isLight, setIsLight] = UseMode();
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

  useEffect(() => {
    if (themeMode === "light") setIsLight(true);
    else if (themeMode === "dark") setIsLight(false);
  }, [themeMode, setIsLight]);

  useEffect(() => {
    if (themeMode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setIsLight(!mq.matches);
    apply();
    const handler = () => apply();
    mq.addEventListener?.("change", handler) ?? mq.addListener?.(handler);
    return () => {
      mq.removeEventListener?.("change", handler) ??
        mq.removeListener?.(handler);
    };
  }, [themeMode, setIsLight]);

  // Position relative to avatar (or fall back)
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const positionMenu = () => {
    const r = anchorRef?.current?.getBoundingClientRect();
    if (!r) return;
    const menuW = menuRef.current?.offsetWidth ?? 260;
    const menuH = menuRef.current?.offsetHeight ?? 440;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const preferredLeft = r.left + r.width / 2 - menuW / 2;
    const left = Math.max(0, Math.min(preferredLeft, vw - menuW));

    const aboveTop = r.top - 12 - menuH;
    const belowTop = r.bottom + 12;
    const top = aboveTop >= 12 ? aboveTop : Math.min(belowTop, vh - menuH - 12);
    setPos({ top, left });
  };

  useEffect(() => {
    if (!open) return;
    positionMenu();
    const id = requestAnimationFrame(positionMenu);
    const onResizeScroll = () => positionMenu();
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("resize", onResizeScroll);
    window.addEventListener("scroll", onResizeScroll, true);
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", onResizeScroll);
      window.removeEventListener("scroll", onResizeScroll, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Theme flyout
  const [themeOpen, setThemeOpen] = useState(false);
  const themeBtnRef = useRef(null);
  const themeRef = useRef(null);
  const [themePos, setThemePos] = useState({ top: 0, left: 0 });
  const hoverTimer = useRef(null);
  const HOVER_CLOSE_DELAY = 180;

  const clearHoverTimer = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };
  const scheduleClose = () => {
    clearHoverTimer();
    hoverTimer.current = setTimeout(
      () => setThemeOpen(false),
      HOVER_CLOSE_DELAY
    );
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

  const closeAll = () => {
    setThemeOpen(false);
    onClose();
  };

  const items = menuItems?.length
    ? menuItems
    : [
        {
          key: "settings",
          label: "Settings",
          icon: Settings,
          to: profileTo,
          type: "link",
        },
        { key: "theme", label: "Theme", icon: Palette, type: "flyout-theme" },
      ];

  if (!open) return null;

  return (
    <Modal
      isOpen={open}
      onClose={closeAll}
      overlayClass="bg-transparent"
      allowScroll={true}
      closeButton={false}
      variant="anchored"
    >
      {/* Main menu */}
      <div
        ref={menuRef}
        role="menu"
        className="fixed z-50 w-[260px] max-w-[calc(100vw)] rounded-2xl bg-bg border border-border-primary shadow-2xl overflow-hidden"
        style={{ top: pos.top, left: pos.left }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3">
          <div className="text-xs font-semibold text-text/80 uppercase tracking-wider mb-2">
            Account
          </div>
          <Row asLink={!!profileTo} to={profileTo} onClick={closeAll}>
            <UserElement
              name={name}
              email={email}
              role={role}
              src={avatarUrl}
            />
            <ChevronRight className="w-4 h-4 text-text/70" />
          </Row>
        </div>

        <Divider />

        <div className="p-2">
          {items.map((item) => {
            if (
              item.type === "flyout-theme" ||
              (item.type === "flyout" && item.key === "theme")
            ) {
              return (
                <div
                  key={item.key}
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
                    <item.icon className="w-4 h-4 text-text" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-text/70" />
                </div>
              );
            }

            return (
              <Row
                key={item.key}
                asLink={!!item.to}
                to={item.to}
                onClick={closeAll}
                icon={item.icon}
                label={item.label}
              />
            );
          })}
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

      {/* Theme submenu */}
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
              badge={
                themeMode === "system" && resolvedTheme === "light"
                  ? "Auto"
                  : undefined
              }
              onClick={() => {
                setThemeMode("light");
                setThemeOpen(false);
                onClose();
              }}
            />
            <ThemeOption
              icon={Moon}
              label="Dark"
              selected={resolvedTheme === "dark"}
              badge={
                themeMode === "system" && resolvedTheme === "dark"
                  ? "Auto"
                  : undefined
              }
              onClick={() => {
                setThemeMode("dark");
                setThemeOpen(false);
                onClose();
              }}
            />
            <ThemeOption
              icon={Monitor}
              label="Sync with system"
              note="Switches automatically with your OS"
              selected={false}
              onClick={() => {
                setThemeMode("system");
                setThemeOpen(false);
                onClose();
              }}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ----- Internals ----- */

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
