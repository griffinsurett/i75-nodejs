import { Archive, Trash2 } from 'lucide-react';

export default function BulkActionsBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onArchive,
  onDelete,
  archiveLabel = "Archive",
  className = "",
  customActions = []
}) {
  if (selectedCount === 0) return null;

  return (
    <div className={`mb-4 p-4 bg-primary/10 rounded-lg flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-heading">
          {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
        </span>
        <button
          onClick={onSelectAll}
          className="text-sm text-primary hover:text-primary/80"
        >
          Select all ({totalCount})
        </button>
        <button
          onClick={onClearSelection}
          className="text-sm text-text hover:text-heading"
        >
          Clear selection
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        {customActions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={action.className || "px-3 py-1.5 bg-bg text-text rounded-md hover:bg-bg2 flex items-center gap-2 text-sm"}
            disabled={action.disabled}
          >
            {action.icon && <action.icon className="w-4 h-4" />}
            {action.label}
          </button>
        ))}
        
        {onArchive && (
          <button
            onClick={onArchive}
            className="px-3 py-1.5 bg-bg text-text rounded-md hover:bg-bg2 flex items-center gap-2 text-sm"
          >
            <Archive className="w-4 h-4" />
            {archiveLabel}
          </button>
        )}
        
        {onDelete && (
          <button
            onClick={onDelete}
            className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}