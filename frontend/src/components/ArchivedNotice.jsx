import { Info } from "lucide-react";

/** Small explanatory banner to show on the Archived view. */
export default function ArchivedNotice({ className = "" }) {
  return (
    <div className={`mb-6 flex items-start gap-3 bg-bg rounded-md border border-border-primary px-4 py-3 ${className}`}>
      <Info className="w-5 h-5 mt-0.5 text-text" />
      <p className="text-sm text-text">
        Archived courses are hidden from active views. If a course was <span className="font-medium">scheduled for deletion</span>, you’ll see a
        countdown—restore before it reaches zero to cancel the delete.
      </p>
    </div>
  );
}
