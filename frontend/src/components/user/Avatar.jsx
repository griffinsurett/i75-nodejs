/**
 * Avatar
 * Renders a circular avatar image or fallback initials.
 *
 * Props:
 * - name?: string            (used for alt + initials)
 * - src?: string             (image URL; if falsy, shows initials)
 * - className?: string       (size + any extra styles; default w-10 h-10)
 * - alt?: string
 */
export default function Avatar({
  name = "Admin User",
  src = "",
  className = "w-10 h-10",
  alt,
}) {
  const initials = getInitials(name);

  if (src) {
    return (
      <img
        src={src}
        alt={alt || `${name} avatar`}
        className={`${className} rounded-full object-cover border border-border-primary`}
      />
    );
  }

  return (
    <div
      className={`${className} rounded-full bg-text/10 text-heading flex items-center justify-center font-semibold`}
      aria-label={alt || `${name} avatar`}
    >
      {initials}
    </div>
  );
}

function getInitials(fullName = "") {
  const parts = fullName.trim().split(/\s+/).slice(0, 2);
  if (!parts.length) return "A";
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "A";
}
