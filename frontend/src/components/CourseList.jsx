// CourseList.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { courseAPI } from '../services/api';
import {
  BookOpen,
  Calendar,
  User,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';

import EditActions from './EditActions';
import ArchiveBadge from './ArchiveBadge';
import ActiveArchivedTabs from './ActiveArchivedTabs';
import ArchivedNotice from './ArchivedNotice';
import useArchiveViewParam from '../hooks/useArchiveViewParam';
import FormattedDate from './FormattedDate';

const CourseList = () => {
  const navigate = useNavigate();
  const [view, setView] = useArchiveViewParam(); // 'active' | 'archived'

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      // Backend: ?archived=true returns archived; no param returns active
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
          onClick={() => navigate('/courses/new')}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Course
        </button>
      </div>

      {isArchivedView && <ArchivedNotice />}

      {/* Empty states / Grid */}
      {courses.length === 0 ? (
        isArchivedView ? (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-text/40 mb-4" />
            <h3 className="text-lg font-medium text-heading mb-2">No archived courses</h3>
            <p className="text-text">Archived courses you hide will appear here.</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-heading mb-2">No courses available</h3>
            <p className="text-text mb-6">Get started by creating your first course.</p>
            <button
              onClick={() => navigate('/courses/new')}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Course
            </button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.courses?.courseId || course.courseId} course={course} onChanged={fetchCourses} />
          ))}
        </div>
      )}
    </div>
  );
};

const CourseCard = ({ course, onChanged }) => {
  // Handle both nested and flat structure
  const courseData = course.courses || course;
  const imageData = course.images;
  const videoData = course.videos;

  return (
    <div className="bg-bg rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
        {/* Actions */}
        <div className="absolute top-2 right-2 z-10">
          <EditActions
            id={courseData.courseId}
            isArchived={courseData.isArchived}
            editTo={`/courses/${courseData.courseId}/edit`}
            api={{
              archive: courseAPI.archiveCourse,
              restore: courseAPI.restoreCourse,
              delete: courseAPI.deleteCourse,
            }}
            onChanged={onChanged}
          />
        </div>

        {imageData?.imageUrl ? (
          <img
            src={imageData.imageUrl}
            alt={imageData.altText || courseData.courseName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BookOpen className="w-12 h-12 text-bg" />
          </div>
        )}

        {courseData.isArchived && (
          <span className="absolute bottom-2 left-2">
            <ArchiveBadge
              archivedAt={courseData.archivedAt}
              scheduledDeleteAt={courseData.purgeAfterAt}
            />
          </span>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold text-heading mb-2 line-clamp-2">
          {courseData.courseName}
        </h3>

        <p className="text-text mb-4 line-clamp-3">
          {courseData.description || 'No description available'}
        </p>

        <div className="space-y-2 mb-4">
          {videoData?.title && (
            <div className="flex items-center text-sm text-text">
              <User className="w-4 h-4 mr-2" />
              <span>Video: {videoData.title}</span>
            </div>
          )}
          <div className="flex items-center text-sm text-text">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Created: <FormattedDate value={courseData.createdAt} variant="short" /></span>
          </div>
          {courseData.updatedAt && (
            <div className="flex items-center text-sm text-text">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Updated: <FormattedDate value={courseData.updatedAt} variant="short" /></span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Link
            to={`/courses/${courseData.courseId}`}
            className="flex-1 bg-primary hover:bg-primary/65 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors text-center"
          >
            View Details
          </Link>
          <Link
            to={`/courses/${courseData.courseId}/sections`}
            className="flex-1 bg-text text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors text-center"
          >
            View Sections
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseList;