import React from "react";

/**
 * Accessible, reusable 2-tab switcher for Active/Archived views.
 *
 * Props:
 * - value: 'active' | 'archived'
 * - onChange: (next: 'active' | 'archived') => void
 * - className?: string
 * - activeLabel?: string
 * - archivedLabel?: string
 */
export default function ActiveArchivedTabs({
  value,
  onChange,
  className = "",
  activeLabel = "Active",
  archivedLabel = "Archived",
}) {
  const isArchived = value === "archived";

  return (
    <div
      role="tablist"
      aria-label="Course view"
      className={`inline-flex rounded-md bg-bg overflow-hidden ${className}`}
    >
      <button
        role="tab"
        aria-selected={!isArchived}
        className={`px-3 py-1.5 text-sm ${
          !isArchived ? "bg-primary text-bg" : "text-text hover:text-heading"
        }`}
        onClick={() => onChange("active")}
      >
        {activeLabel}
      </button>
      <button
        role="tab"
        aria-selected={isArchived}
        className={`px-3 py-1.5 text-sm ${
          isArchived ? "bg-primary text-bg" : "text-text hover:text-heading"
        }`}
        onClick={() => onChange("archived")}
      >
        {archivedLabel}
      </button>
    </div>
  );
}
