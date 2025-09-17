// frontend/src/components/CurrentUser.jsx
import { useRef, useState } from "react";
import { Settings, Palette } from "lucide-react";
import UserMenu from "./UserMenu";
import UserElement from "./UserElement";

/**
 * CurrentUser
 * Clickable profile row; opens the reusable <UserMenu /> anchored above the avatar.
 * If `compact` is true, only the avatar is shown (like collapsed ChatGPT sidebar).
 */
export default function CurrentUser({
  name = "Admin User",
  role = "Platform Administrator",
  email,
  avatarUrl = "",
  profileTo = "/account",
  onSignOut,
  className = "",
  compact = false,
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  // Menu items (excluding Logout)
  const menuItems = [
    { key: "settings", label: "Settings", icon: Settings, to: profileTo, type: "link" },
    { key: "theme", label: "Theme", icon: Palette, type: "flyout-theme" },
  ];

  return (
    <>
      <div
        className={`
          ${compact ? "flex justify-center" : "flex items-center gap-2"}
          rounded-xl cursor-pointer ${compact ? "px-1.5 py-1.5" : "px-3 py-2"}
          transition-colors ${open ? "bg-bg2" : "hover:bg-bg2"}
          ${className}
        `}
        role="button"
        aria-expanded={open}
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
      >
        <UserElement
          ref={anchorRef}
          name={name}
          email={email}
          role={role}
          src={avatarUrl}
          showMeta={!compact}
          className={compact ? "pointer-events-none" : "pointer-events-none"}
        />
      </div>

      <UserMenu
        open={open}
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
        name={name}
        role={role}
        email={email}
        avatarUrl={avatarUrl}
        profileTo={profileTo}
        onSignOut={onSignOut}
        menuItems={menuItems}
      />
    </>
  );
}
