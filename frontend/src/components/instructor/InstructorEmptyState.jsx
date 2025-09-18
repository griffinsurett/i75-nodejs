// frontend/src/components/instructor/InstructorEmptyState.jsx
import { Users, Plus } from 'lucide-react';

export default function InstructorEmptyState({ isArchived, onAddInstructor }) {
  if (isArchived) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <Users className="w-12 h-12 mx-auto text-text/40 mb-4" />
        <h3 className="text-lg font-medium text-heading mb-2">No archived instructors</h3>
        <p className="text-text">Archived instructors you hide will appear here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
      <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-heading mb-2">No instructors available</h3>
      <p className="text-text mb-6">Get started by adding your first instructor.</p>
      <button
        onClick={onAddInstructor}
        className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Instructor
      </button>
    </div>
  );
}