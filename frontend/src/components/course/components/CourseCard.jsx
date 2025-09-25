// frontend/src/components/course/CourseCard.jsx
import { Link } from "react-router-dom";
import { BookOpen, User } from "lucide-react";
import EditActions from "../../archive/EditActions";
import ArchiveBadge from "../../archive/ArchiveBadge";
import ImageWithFallback from "../../common/ImageWithFallback";
import DateDisplay from "../../common/DateDisplay";
import MediaIndicator from "../../common/MediaIndicator";
import ContentPreview from "../../common/ContentPreview";
import StatsGrid from "../../common/StatsGrid";
import { courseAPI } from "../../../services/api";

export default function CourseCard({ course, onChanged }) {
  // Handle both nested and flat structure
  const courseData = course.courses || course;
  const imageData = course.images;
  const videoData = course.videos;

  // Prepare stats if available
  const stats = [];
  if (courseData.sectionCount !== undefined) {
    stats.push({ label: "Sections", value: courseData.sectionCount });
  }
  if (courseData.studentCount !== undefined) {
    stats.push({ label: "Students", value: courseData.studentCount });
  }

  return (
    <div className="bg-bg rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
        {/* Actions */}
        <div className="absolute top-2 right-2 z-10">
          <EditActions
            id={courseData.courseId}
            isArchived={courseData.isArchived}
            editTo={`/courses/${courseData.courseId}/edit`}
            entityName="course"
            api={{
              archive: courseAPI.archiveCourse,
              restore: courseAPI.restoreCourse,
              delete: courseAPI.deleteCourse,
            }}
            onChanged={onChanged}
          />
        </div>

        <ImageWithFallback
          src={imageData?.imageUrl}
          alt={imageData?.altText || courseData.courseName}
          type="course"
          size="full"
          iconSize="lg"
          className="w-full h-full object-cover"
        />

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

        {/* Use ContentPreview instead of custom truncation */}
        <p className="text-text mb-4">{courseData.description || "No description available"}</p>

        <div className="space-y-2 mb-4">
          {videoData?.title && (
            <MediaIndicator type="video" title={`Video: ${videoData.title}`} />
          )}
          <DateDisplay
            label="Created"
            date={courseData.createdAt}
            variant="compact"
            icon="calendar"
          />
          {courseData.updatedAt && (
            <DateDisplay
              label="Updated"
              date={courseData.updatedAt}
              variant="compact"
              icon="clock"
            />
          )}
        </div>

        {/* Add stats if available */}
        {stats.length > 0 && (
          <StatsGrid stats={stats} className="mb-4" />
        )}

        <Link
          to={`/courses/${courseData.courseId}`}
          className="block w-full bg-primary hover:bg-primary/65 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors text-center"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}