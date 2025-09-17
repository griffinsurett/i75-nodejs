import { Link } from "react-router-dom";
import { BookOpen, Calendar, User } from "lucide-react";
import EditActions from "../archive/EditActions";
import ArchiveBadge from "../archive/ArchiveBadge";
import { formatDate } from "../../utils/formatDate";
import { courseAPI } from "../../services/api";

export default function CourseCard({ course, onChanged }) {
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
          {courseData.description || "No description available"}
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
            <span>
              Created: {formatDate(courseData.createdAt, { variant: "short" })}
            </span>
          </div>
          {courseData.updatedAt && (
            <div className="flex items-center text-sm text-text">
              <Calendar className="w-4 h-4 mr-2" />
              <span>
                Updated:{" "}
                {formatDate(courseData.updatedAt, { variant: "short" })}
              </span>
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
}
