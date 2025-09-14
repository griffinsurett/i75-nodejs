// frontend/src/components/UserElement.jsx
import React, { forwardRef } from "react";
import Avatar from "./Avatar";

/**
 * UserElement
 * Shows Avatar + name + secondary line (email or role).
 * For anchoring popovers, we forwardRef to the avatar wrapper.
 */
const UserElement = forwardRef(function UserElement(
  {
    name = "Admin User",
    email,
    role,
    src = "",
    className = "",
    nameClassName = "font-semibold text-heading truncate",
    subClassName = "text-sm text-text truncate",
  },
  ref
) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* ref goes on the avatar wrapper so menus can anchor to it */}
      <div ref={ref} className="shrink-0 rounded-full">
        <Avatar name={name} src={src} />
      </div>

      <div className="min-w-0">
        <div className={nameClassName}>{name}</div>
        <div className={subClassName}>{email || role}</div>
      </div>
    </div>
  );
});

export default UserElement;
