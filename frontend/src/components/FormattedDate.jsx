/**
 * Formats a date value with sensible defaults.
 *
 * Props:
 * - value: string | number | Date
 * - variant: 'long' | 'short' (default: 'long')
 * - empty: string shown when value is falsy/invalid (default: 'Not specified')
 * - locale: BCP47 locale (default: 'en-US')
 * - options: Intl.DateTimeFormatOptions (override defaults per variant)
 */
export default function FormattedDate({
  value,
  variant = "long",
  empty = "Not specified",
  locale = "en-US",
  options,
}) {
  if (!value) return <span>{empty}</span>;
  const d = new Date(value);
  if (isNaN(d.getTime())) return <span>{empty}</span>;

  const defaultOptions =
    variant === "short"
      ? { year: "numeric", month: "short", day: "numeric" }
      : { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" };

  const fmt = new Intl.DateTimeFormat(locale, options ?? defaultOptions);
  return <span>{fmt.format(d)}</span>;
}
