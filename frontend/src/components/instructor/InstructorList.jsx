// frontend/src/components/instructor/InstructorList.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { instructorAPI } from '../../services/api';
import { Loader2, AlertCircle, Plus } from 'lucide-react';
import ActiveArchivedTabs from '../archive/ActiveArchivedTabs';
import ArchivedNotice from '../archive/ArchivedNotice';
import useArchiveViewParam from '../../hooks/useArchiveViewParam';
import InstructorCard from './InstructorCard';
import InstructorEmptyState from './InstructorEmptyState';

const InstructorList = () => {
  const navigate = useNavigate();
  const [view, setView] = useArchiveViewParam();
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInstructors = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res =
        view === 'archived'
          ? await instructorAPI.getAllInstructors({ archived: 'true' })
          : await instructorAPI.getAllInstructors();

      if (res.data?.success) setInstructors(res.data.data || []);
      else setError('Failed to fetch instructors');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to fetch instructors');
      console.error('Error fetching instructors:', e);
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading instructors...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64 text-red-600">
        <AlertCircle className="w-6 h-6 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  const isArchivedView = view === 'archived';
  const handleAddInstructor = () => navigate('/instructors/new');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-heading">
            {isArchivedView ? 'Archived Instructors' : 'Instructors'}
          </h1>
          <ActiveArchivedTabs value={view} onChange={setView} className="ml-2" />
        </div>

        <button
          onClick={handleAddInstructor}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Instructor
        </button>
      </div>

      {isArchivedView && <ArchivedNotice />}

      {/* Content */}
      {instructors.length === 0 ? (
        <InstructorEmptyState isArchived={isArchivedView} onAddInstructor={handleAddInstructor} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instructors.map((instructor) => (
            <InstructorCard
              key={instructor.instructors?.instructorId || instructor.instructorId}
              instructor={instructor}
              onChanged={fetchInstructors}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorList;