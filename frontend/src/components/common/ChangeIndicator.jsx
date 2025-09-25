// frontend/src/components/common/ChangeIndicator.jsx
import { AlertCircle, Plus, Edit, Trash, RefreshCw } from 'lucide-react';

export default function ChangeIndicator({ 
  changes,
  className = '' 
}) {
  const { added = 0, modified = 0, deleted = 0, reordered = false } = changes;
  const total = added + modified + deleted + (reordered ? 1 : 0);

  if (total === 0) return null;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="text-xs text-orange-600 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {total} unsaved change{total !== 1 ? 's' : ''}
      </div>
      
      {added > 0 && (
        <div className="text-xs text-green-600 flex items-center gap-1 ml-4">
          <Plus className="w-3 h-3" />
          {added} added
        </div>
      )}
      
      {modified > 0 && (
        <div className="text-xs text-blue-600 flex items-center gap-1 ml-4">
          <Edit className="w-3 h-3" />
          {modified} modified
        </div>
      )}
      
      {deleted > 0 && (
        <div className="text-xs text-red-600 flex items-center gap-1 ml-4">
          <Trash className="w-3 h-3" />
          {deleted} deleted
        </div>
      )}
      
      {reordered && (
        <div className="text-xs text-purple-600 flex items-center gap-1 ml-4">
          <RefreshCw className="w-3 h-3" />
          Order changed
        </div>
      )}
    </div>
  );
}