/**
 * Formats a date value with sensible defaults.
 * @param {string | number | Date} value - The date value to format
 * @param {Object} options - Formatting options
 * @param {string} options.variant - 'long' | 'short' (default: 'long')
 * @param {string} options.empty - Text shown when value is falsy/invalid (default: 'Not specified')
 * @param {string} options.locale - BCP47 locale (default: 'en-US')
 * @param {Intl.DateTimeFormatOptions} options.formatOptions - Override defaults per variant
 * @returns {string} Formatted date string
 */
export function formatDate(value, options = {}) {
  const {
    variant = "long",
    empty = "Not specified",
    locale = "en-US",
    formatOptions
  } = options;

  if (!value) return empty;
  const d = new Date(value);
  if (isNaN(d.getTime())) return empty;

  const defaultOptions =
    variant === "short"
      ? { year: "numeric", month: "short", day: "numeric" }
      : { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" };

  const fmt = new Intl.DateTimeFormat(locale, formatOptions ?? defaultOptions);
  return fmt.format(d);
}