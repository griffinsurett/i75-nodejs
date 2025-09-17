import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseAPI } from '../../services/api';
import { Loader2, AlertCircle, Plus } from 'lucide-react';
import ActiveArchivedTabs from '../archive/ActiveArchivedTabs';
import ArchivedNotice from '../archive/ArchivedNotice';
import useArchiveViewParam from '../../hooks/useArchiveViewParam';
import CourseCard from './CourseCard';
import CourseEmptyState from './CourseEmptyState';

const CourseList = () => {
  const navigate = useNavigate();
  const [view, setView] = useArchiveViewParam();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res =
        view === 'archived'
          ? await courseAPI.getAllCourses({ archived: 'true' })
          : await courseAPI.getAllCourses();

      if (res.data?.success) setCourses(res.data.data || []);
      else setError('Failed to fetch courses');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to fetch courses');
      console.error('Error fetching courses:', e);
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading courses...</span>
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
  const handleAddCourse = () => navigate('/courses/new');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-heading">
            {isArchivedView ? 'Archived Courses' : 'Available Courses'}
          </h1>
          <ActiveArchivedTabs value={view} onChange={setView} className="ml-2" />
        </div>

        <button
          onClick={handleAddCourse}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Course
        </button>
      </div>

      {isArchivedView && <ArchivedNotice />}

      {/* Content */}
      {courses.length === 0 ? (
        <CourseEmptyState isArchived={isArchivedView} onAddCourse={handleAddCourse} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.courses?.courseId || course.courseId}
              course={course}
              onChanged={fetchCourses}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseList;