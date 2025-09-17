import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { courseAPI } from '../services/api';
import {
  BookOpen,
  Calendar,
  User,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Play,
  FileText,
  Users,
} from 'lucide-react';

import EditActions from './EditActions';
import ArchiveBadge from './ArchiveBadge';
import FormattedDate from './FormattedDate';

const CourseDetail = () => {
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [courseResponse, sectionsResponse] = await Promise.all([
        courseAPI.getCourse(courseId),
        courseAPI.getCourseSections(courseId),
      ]);

      if (courseResponse.data.success) {
        setCourse(courseResponse.data.data);
      } else {
        throw new Error('Failed to fetch course details');
      }

      if (sectionsResponse.data.success) {
        setSections(sectionsResponse.data.data);
      } else {
        throw new Error('Failed to fetch course sections');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch course data');
      console.error('Error fetching course data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchCourseData();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-text/70">Loading course details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-64 text-red-600">
          <AlertCircle className="w-6 h-6 mr-2" />
          <span>{error}</span>
        </div>
        <div className="mt-4 text-center">
          <Link to="/courses" className="inline-flex items-center text-primary hover:text-primary/65">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto text-text mb-4" />
          <h3 className="text-lg font-medium text-heading mb-2">Course not found</h3>
          <p className="text-text mb-4">The requested course could not be found.</p>
          <Link to="/courses" className="inline-flex items-center text-primary hover:text-primary/65">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  // Extract nested data from joined tables
  const courseData = course.courses || course;
  const imageData = course.images;
  const videoData = course.videos;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between relative">
        <Link to="/courses" className="inline-flex items-center text-primary hover:text-primary/65">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Link>

        <EditActions
          id={courseData.courseId}
          isArchived={courseData.isArchived}
          editTo={`/courses/${courseData.courseId}/edit`}
          api={{
            archive: courseAPI.archiveCourse,
            restore: courseAPI.restoreCourse,
            delete: courseAPI.deleteCourse,
          }}
          onChanged={fetchCourseData}
        />
      </div>

      {/* Course Header */}
      <div className="bg-bg rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="md:flex">
          {/* Course Image */}
          <div className="md:w-1/3 relative">
            <div className="h-64 md:h-full bg-gradient-to-r from-blue-500 to-purple-600">
              {imageData?.imageUrl ? (
                <img
                  src={imageData.imageUrl}
                  alt={imageData.altText || courseData.courseName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <BookOpen className="w-16 h-16 text-text" />
                </div>
              )}
            </div>

            {courseData.isArchived && (
              <span className="absolute top-2 left-2">
                <ArchiveBadge
                  archivedAt={courseData.archivedAt}
                  scheduledDeleteAt={courseData.purgeAfterAt}
                />
              </span>
            )}
          </div>

          {/* Course Info */}
          <div className="md:w-2/3 p-6">
            <h1 className="text-3xl font-bold text-heading mb-4">
              {courseData.courseName}
            </h1>

            <p className="text-text/70 text-lg mb-6">
              {courseData.description || 'No description available'}
            </p>

            {/* Course Meta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center text-text/70">
                <Calendar className="w-5 h-5 mr-2" />
                <div>
                  <div className="font-medium">Created</div>
                  <div className="text-sm"><FormattedDate value={courseData.createdAt} /></div>
                </div>
              </div>

              {courseData.updatedAt && (
                <div className="flex items-center text-text/70">
                  <Calendar className="w-5 h-5 mr-2" />
                  <div>
                    <div className="font-medium">Last Updated</div>
                    <div className="text-sm"><FormattedDate value={courseData.updatedAt} /></div>
                  </div>
                </div>
              )}

              {videoData?.title && (
                <div className="flex items-center text-text/70">
                  <Play className="w-5 h-5 mr-2" />
                  <div>
                    <div className="font-medium">Course Video</div>
                    <div className="text-sm">{videoData.title}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Instructors */}
            {courseData.instructors && courseData.instructors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-heading mb-3 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Instructors
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {courseData.instructors.map((instructor) => {
                    const inst = instructor.instructors || instructor;
                    const instImage = instructor.images;
                    
                    return (
                      <div key={inst.instructorId} className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-bg2 rounded-full flex items-center justify-center">
                          {instImage?.imageUrl ? (
                            <img
                              src={instImage.imageUrl}
                              alt={inst.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-text" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-heading">{inst.name}</div>
                          {inst.bio && (
                            <div className="text-sm text-text truncate">{inst.bio}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Sections */}
      <div className="bg-bg rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-heading mb-6 flex items-center">
          <FileText className="w-6 h-6 mr-2" />
          Course Sections ({sections.length})
        </h2>

        {sections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section) => {
              const sectionData = section.sections || section;
              const sectionVideo = section.videos;
              
              return (
                <div key={sectionData.sectionId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg text-heading mb-2">
                    {sectionData.title}
                  </h3>

                  <p className="text-text text-sm mb-4 line-clamp-3">
                    {sectionData.description || 'No description available'}
                  </p>

                  {sectionVideo?.title && (
                    <div className="flex items-center text-sm text-text/70 mb-3">
                      <Play className="w-4 h-4 mr-1" />
                      <span>{sectionVideo.title}</span>
                    </div>
                  )}

                  <Link
                    to={`/sections/${sectionData.sectionId}/chapters`}
                    className="inline-block bg-primary hover:bg-primary/50 text-text px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    View Chapters
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto text-text/70 mb-4" />
            <h3 className="text-lg font-medium text-heading mb-2">No sections available</h3>
            <p className="text-text">This course doesn't have any sections yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;