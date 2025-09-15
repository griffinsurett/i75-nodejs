// frontend/src/components/UserElement.jsx
import React, { forwardRef } from "react";
import Avatar from "./Avatar";

/**
 * UserElement
 * Avatar + (optional) meta. For anchoring popovers, we forwardRef to the avatar wrapper.
 */
const UserElement = forwardRef(function UserElement(
  {
    name = "Admin User",
    email,
    role,
    src = "",
    className = "",
    showMeta = true,
    nameClassName = "font-semibold text-heading truncate",
    subClassName = "text-sm text-text truncate",
  },
  ref
) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div ref={ref} className="shrink-0 rounded-full">
        <Avatar name={name} src={src} />
      </div>
      {showMeta && (
        <div className="min-w-0">
          <div className={nameClassName}>{name}</div>
          <div className={subClassName}>{email || role}</div>
        </div>
      )}
    </div>
  );
});

export default UserElement;
