// frontend/src/components/course/sections/edit/ChapterDeletionBadge.jsx
import { useState, useEffect, useRef } from 'react';
import { RotateCcw, Trash2, AlertTriangle } from 'lucide-react';

export default function ChapterDeletionBadge({
  deletedAt,
  scheduledDeleteAt,
  onUndo,
  onExpired,
  isPending = true,
  className = ''
}) {
  const [now, setNow] = useState(Date.now());
  const hasFiredExpired = useRef(false);

  // Always run the timer — it's harmless when not counting down
  useEffect(() => {
    if (!scheduledDeleteAt) return;
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, [scheduledDeleteAt]);

  // Fire onExpired callback once when countdown reaches zero
  const deletionTime = scheduledDeleteAt ? new Date(scheduledDeleteAt).getTime() : 0;
  const remainingMs = deletionTime - now;
  const isExpired = scheduledDeleteAt && remainingMs <= 0;

  useEffect(() => {
    if (isExpired && !hasFiredExpired.current && onExpired) {
      hasFiredExpired.current = true;
      onExpired();
    }
  }, [isExpired, onExpired]);

  // Reset when scheduledDeleteAt changes
  useEffect(() => {
    hasFiredExpired.current = false;
  }, [scheduledDeleteAt]);

  // Scheduled deletion countdown (after save)
  if (scheduledDeleteAt) {
    if (isExpired) {
      return (
        <div className={`flex items-center gap-2 px-2 py-1 rounded bg-red-600 text-white text-xs ${className}`}>
          <Trash2 className="w-3 h-3" />
          <span>Deleted</span>
        </div>
      );
    }

    const seconds = Math.ceil(remainingMs / 1000);

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-500 text-white text-xs">
          <Trash2 className="w-3 h-3" />
          <span>Deleting in {seconds}s</span>
        </div>
        {onUndo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUndo();
            }}
            className="px-2 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-xs flex items-center gap-1 transition-colors"
            title="Undo deletion"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Undo</span>
          </button>
        )}
      </div>
    );
  }

  // If pending deletion (not saved yet)
  if (isPending) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-orange-500 text-white text-xs">
          <AlertTriangle className="w-3 h-3" />
          <span>Marked for deletion</span>
        </div>
        {onUndo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUndo();
            }}
            className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs flex items-center gap-1 transition-colors"
            title="Cancel deletion"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Cancel</span>
          </button>
        )}
      </div>
    );
  }

  return null;
}