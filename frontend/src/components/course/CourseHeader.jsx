import { BookOpen, Calendar, Play } from "lucide-react";
import ArchiveBadge from "../archive/ArchiveBadge";
import CourseInstructors from "./CourseInstructors";
import { formatDate } from "../../utils/formatDate";

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
            {courseData.description || "No description available"}
          </p>

          {/* Course Meta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center text-text/70">
              <Calendar className="w-5 h-5 mr-2" />
              <div>
                <div className="font-medium">Created</div>
                <div className="text-sm">
                  {formatDate(courseData.createdAt)}
                </div>
              </div>
            </div>

            {courseData.updatedAt && (
              <div className="flex items-center text-text/70">
                <Calendar className="w-5 h-5 mr-2" />
                <div>
                  <div className="font-medium">Last Updated</div>
                  <div className="text-sm">
                    {formatDate(courseData.updatedAt)}
                  </div>
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
            <CourseInstructors instructors={courseData.instructors} />
          )}
        </div>
      </div>
    </div>
  );
}
