import { BookOpen, Plus } from 'lucide-react';

export default function CourseEmptyState({ isArchived, onAddCourse }) {
  if (isArchived) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <BookOpen className="w-12 h-12 mx-auto text-text/40 mb-4" />
        <h3 className="text-lg font-medium text-heading mb-2">No archived courses</h3>
        <p className="text-text">Archived courses you hide will appear here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
      <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-heading mb-2">No courses available</h3>
      <p className="text-text mb-6">Get started by creating your first course.</p>
      <button
        onClick={onAddCourse}
        className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Course
      </button>
    </div>
  );
}