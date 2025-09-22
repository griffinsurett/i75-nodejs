// frontend/src/components/course/sections/edit/ChapterDeletionBadge.jsx
import { useState, useEffect } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';

export default function ChapterDeletionBadge({ 
  deletedAt, 
  onUndo,
  className = '' 
}) {
  const [now, setNow] = useState(Date.now());
  const DELETION_DELAY = 30000; // 30 seconds before permanent deletion
  const deletionTime = deletedAt + DELETION_DELAY;
  
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, []);

  const remainingMs = deletionTime - now;
  const isExpired = remainingMs <= 0;

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
    </div>
  );
}