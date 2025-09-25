// frontend/src/components/instructor/views/InstructorDetail.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { instructorAPI } from "../../../services/api";
import { User, BookOpen } from "lucide-react";
import EditActions from "../../archive/EditActions";
import BackButton from "../../navigation/BackButton";
import PageLoadingState from "../../common/PageLoadingState";
import PageErrorState from "../../common/PageErrorState";
import EmptyState from "../../common/EmptyState";
import InstructorProfileHeader from "../components/InstructorProfileHeader";
import InstructorInfoCard from "../components/InstructorInfoCard";
import InstructorCoursesList from "../components/InstructorCoursesList";
import ListHeader from "../../common/ListHeader";

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
    return <PageLoadingState message="Loading instructor details..." />;
  }

  if (error) {
    return (
      <PageErrorState
        error={error}
        backUrl="/instructors"
        backLabel="Back to Instructors"
      />
    );
  }

  if (!instructor) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EmptyState
          icon={User}
          title="Instructor not found"
          description="The requested instructor could not be found."
          action={
            <BackButton to="/instructors">Back to Instructors</BackButton>
          }
        />
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

      {/* Profile Header */}
      <InstructorProfileHeader
        instructor={instructor}
        imageData={imageData}
        className="mb-8"
      />

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <InstructorInfoCard instructor={instructor} variant="details" />

        <div className="bg-bg rounded-lg shadow-md p-6">
          <ListHeader
            title="Assigned Courses"
            count={instructorData.courses?.length || 0}
            icon={BookOpen}
          />
          <InstructorCoursesList
            courses={instructorData.courses || []}
            showViewAll={false}
            maxDisplay={10}
          />
        </div>
      </div>
    </div>
  );
};

export default InstructorDetail;