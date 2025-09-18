// ArchiveBadge.jsx
import { useEffect, useState } from "react";

/**
 * Shows "Archived" or a live countdown if scheduled_delete_at is provided.
 */
export default function ArchiveBadge({ archivedAt, scheduledDeleteAt }) {
  const [now, setNow] = useState(Date.now());
  const target = scheduledDeleteAt ? new Date(scheduledDeleteAt).getTime() : null;

  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);

  const remainingMs = target ? target - now : null;
  const showCountdown = remainingMs !== null && remainingMs > 0;

  return (
    <span className="text-xs px-2 py-1 rounded bg-text/80 text-bg">
      {showCountdown ? `Deleting in ${fmt(remainingMs)}` : "Archived"}
    </span>
  );
}

function fmt(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  return m ? `${m}:${ss}` : `0:${ss}`;
}
