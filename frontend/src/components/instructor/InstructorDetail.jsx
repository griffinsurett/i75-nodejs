// frontend/src/components/instructor/InstructorDetail.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { instructorAPI } from "../../services/api";
import {
  User,
  Loader2,
  AlertCircle,
  Mail,
  BookOpen,
} from "lucide-react";
import EditActions from "../archive/EditActions";
import ArchiveBadge from "../archive/ArchiveBadge";
import { formatDate } from "../../utils/formatDate";
import BackButton from "../navigation/BackButton";
import { Link } from "react-router-dom";

const InstructorDetail = () => {
  const { instructorId } = useParams();
  const [instructor, setInstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInstructorData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await instructorAPI.getInstructor(instructorId);

      if (response.data.success) {
        setInstructor(response.data.data);
      } else {
        throw new Error("Failed to fetch instructor details");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch instructor data"
      );
      console.error("Error fetching instructor data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (instructorId) fetchInstructorData();
  }, [instructorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-text/70">Loading instructor details...</span>
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
          <BackButton to="/instructors">Back to Instructors</BackButton>
        </div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <User className="w-12 h-12 mx-auto text-text mb-4" />
          <h3 className="text-lg font-medium text-heading mb-2">
            Instructor not found
          </h3>
          <p className="text-text mb-4">
            The requested instructor could not be found.
          </p>
          <BackButton to="/instructors">Back to Instructors</BackButton>
        </div>
      </div>
    );
  }

  const instructorData = instructor.instructors || instructor;
  const imageData = instructor.images;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between relative">
        <BackButton to="/instructors">Back to Instructors</BackButton>

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
          onChanged={fetchInstructorData}
        />
      </div>

      {/* Profile Section - rest of component stays the same */}
      <div className="bg-bg rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="h-32 bg-gradient-to-r from-purple-500 to-pink-600"></div>
        <div className="px-6 pb-6 -mt-16">
          <div className="flex items-end gap-6">
            {imageData?.imageUrl ? (
              <img
                src={imageData.imageUrl}
                alt={imageData.altText || instructorData.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-bg shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-bg2 flex items-center justify-center border-4 border-bg shadow-lg">
                <User className="w-16 h-16 text-text/40" />
              </div>
            )}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-heading">
                  {instructorData.name}
                </h1>
                {instructorData.isArchived && (
                  <ArchiveBadge
                    archivedAt={instructorData.archivedAt}
                    scheduledDeleteAt={instructorData.purgeAfterAt}
                  />
                )}
              </div>
              <p className="text-text/70 text-lg">
                {instructorData.bio || "No bio available"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards - rest stays the same */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-bg rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-heading mb-4">Details</h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-text/70">Instructor ID</dt>
              <dd className="text-heading font-mono">
                #{instructorData.instructorId}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-text/70">Joined</dt>
              <dd className="text-heading">
                {formatDate(instructorData.createdAt)}
              </dd>
            </div>
            {instructorData.updatedAt && (
              <div>
                <dt className="text-sm text-text/70">Last Updated</dt>
                <dd className="text-heading">
                  {formatDate(instructorData.updatedAt)}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-bg rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-heading mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Assigned Courses
          </h3>
          {instructorData.courses && instructorData.courses.length > 0 ? (
            <ul className="space-y-2">
              {instructorData.courses.map((course) => {
                const courseData = course.courses || course;
                return (
                  <li key={courseData.courseId}>
                    <Link
                      to={`/courses/${courseData.courseId}`}
                      className="text-primary hover:text-primary/65 hover:underline"
                    >
                      {courseData.courseName}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-text/70">No courses assigned</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorDetail;