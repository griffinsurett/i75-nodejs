import { BookOpen, Play } from 'lucide-react';
import ArchiveBadge from '../archive/ArchiveBadge';
import CourseInstructors from './CourseInstructors';
import ImageWithFallback from '../common/ImageWithFallback';
import DateDisplay from '../common/DateDisplay';
import MediaIndicator from '../common/MediaIndicator';

export default function CourseHeader({ course }) {
  const courseData = course.courses || course;
  const imageData = course.images;
  const videoData = course.videos;

  return (
    <div className="bg-bg rounded-lg shadow-lg overflow-hidden mb-8">
      <div className="md:flex">
        {/* Course Image */}
        <div className="md:w-1/3 relative">
          <div className="h-64 md:h-full bg-gradient-to-r from-blue-500 to-purple-600">
            <ImageWithFallback
              src={imageData?.imageUrl}
              alt={imageData?.altText || courseData.courseName}
              type="course"
              size="full"
              iconSize="xl"
              className="w-full h-full object-cover"
            />
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
            <DateDisplay
              label="Created"
              date={courseData.createdAt}
              icon="calendar"
            />

            {courseData.updatedAt && (
              <DateDisplay
                label="Last Updated"
                date={courseData.updatedAt}
                icon="clock"
              />
            )}

            {videoData?.title && (
              <MediaIndicator 
                type="video" 
                title={`Course Video: ${videoData.title}`}
                className="flex items-center text-text/70"
              />
            )}
          </div>

          {/* Instructors */}
          {courseData.instructors && courseData.instructors.length > 0 && (
            <CourseInstructors instructors={courseData.instructors} />
          )}
        </div>
      </div>
    </div>
  );
}