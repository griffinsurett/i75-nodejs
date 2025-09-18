// frontend/src/components/instructor/InstructorCard.jsx
import { Link } from "react-router-dom";
import { User, Mail, Calendar, BookOpen } from "lucide-react";
import EditActions from "../archive/EditActions";
import ArchiveBadge from "../archive/ArchiveBadge";
import { formatDate } from "../../utils/formatDate";
import { instructorAPI } from "../../services/api";

export default function InstructorCard({ instructor, onChanged }) {
  // Handle both nested and flat structure
  const instructorData = instructor.instructors || instructor;
  const imageData = instructor.images;

  return (
    <div className="bg-bg rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="relative">
        {/* Actions */}
        <div className="absolute top-2 right-2 z-10">
          <EditActions
            id={instructorData.instructorId}
            isArchived={instructorData.isArchived}
            editTo={`/instructors/${instructorData.instructorId}/edit`}
            entityName="instructor"
            api={{
              archive: instructorAPI.archiveInstructor,
              restore: instructorAPI.restoreInstructor,
              delete: instructorAPI.deleteInstructor,
            }}
            onChanged={onChanged}
          />
        </div>

        {/* Profile Image Section */}
        <div className="h-48 bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center relative">
          {imageData?.imageUrl ? (
            <img
              src={imageData.imageUrl}
              alt={imageData.altText || instructorData.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border-4 border-white shadow-lg">
              <User className="w-16 h-16 text-white" />
            </div>
          )}

          {instructorData.isArchived && (
            <span className="absolute bottom-2 left-2">
              <ArchiveBadge
                archivedAt={instructorData.archivedAt}
                scheduledDeleteAt={instructorData.purgeAfterAt}
              />
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold text-heading mb-2">
          {instructorData.name}
        </h3>

        <p className="text-text mb-4 line-clamp-3">
          {instructorData.bio || "No bio available"}
        </p>

        <div className="space-y-2 mb-4 text-sm">
          {instructorData.courseCount !== undefined && (
            <div className="flex items-center text-text">
              <BookOpen className="w-4 h-4 mr-2" />
              <span>{instructorData.courseCount} Courses</span>
            </div>
          )}
          <div className="flex items-center text-text">
            <Calendar className="w-4 h-4 mr-2" />
            <span>
              Joined: {formatDate(instructorData.createdAt, { variant: "short" })}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to={`/instructors/${instructorData.instructorId}`}
            className="flex-1 bg-primary hover:bg-primary/65 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors text-center"
          >
            View Profile
          </Link>
          <Link
            to={`/instructors/${instructorData.instructorId}/courses`}
            className="flex-1 bg-text text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors text-center"
          >
            View Courses
          </Link>
        </div>
      </div>
    </div>
  );
}