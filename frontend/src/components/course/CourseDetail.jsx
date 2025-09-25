// frontend/src/components/course/CourseDetail.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { courseAPI } from "../../services/api";
import { BookOpen } from "lucide-react";
import EditActions from "../archive/EditActions";
import CourseHeader from "./CourseHeader";
import CourseSections from "../../components/course/sections/lists/CourseSections";
import BackButton from "../navigation/BackButton";
import PageLoadingState from "../common/PageLoadingState";
import PageErrorState from "../common/PageErrorState";
import EmptyState from "../common/EmptyState";

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
        throw new Error("Failed to fetch course details");
      }

      if (sectionsResponse.data.success) {
        setSections(sectionsResponse.data.data);
      } else {
        throw new Error("Failed to fetch course sections");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch course data"
      );
      console.error("Error fetching course data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchCourseData();
  }, [courseId]);

  if (loading) {
    return <PageLoadingState message="Loading course details..." />;
  }

  if (error) {
    return (
      <PageErrorState
        error={error}
        backUrl="/courses"
        backLabel="Back to Courses"
      />
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EmptyState
          icon={BookOpen}
          title="Course not found"
          description="The requested course could not be found."
          action={
            <BackButton to="/courses">Back to Courses</BackButton>
          }
        />
      </div>
    );
  }

  const courseData = course.courses || course;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between relative">
        <BackButton to="/courses">Back to Courses</BackButton>

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
          onChanged={fetchCourseData}
        />
      </div>

      <CourseHeader course={course} />
      <CourseSections
        courseId={courseId}
        sections={sections}
        onRefresh={fetchCourseData}
      />
    </div>
  );
};

export default CourseDetail;