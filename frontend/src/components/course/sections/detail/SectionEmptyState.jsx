// frontend/src/components/section/SectionEmptyState.jsx
import { FileText, Plus } from 'lucide-react';

export default function SectionEmptyState({ isArchived, onAddSection }) {
  if (isArchived) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <FileText className="w-12 h-12 mx-auto text-text/40 mb-4" />
        <h3 className="text-lg font-medium text-heading mb-2">No archived sections</h3>
        <p className="text-text">Archived sections you hide will appear here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
      <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-heading mb-2">No sections available</h3>
      <p className="text-text mb-6">Get started by adding your first section.</p>
      <button
        onClick={onAddSection}
        className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Section
      </button>
    </div>
  );
}