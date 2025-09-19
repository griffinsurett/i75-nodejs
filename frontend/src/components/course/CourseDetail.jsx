// frontend/src/components/course/CourseDetail.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { courseAPI } from "../../services/api";
import { BookOpen, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import EditActions from "../archive/EditActions";
import CourseHeader from "./CourseHeader";
import CourseSections from "./sections/CourseSections";

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
          <Link
            to="/courses"
            className="inline-flex items-center text-primary hover:text-primary/65"
          >
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
          <h3 className="text-lg font-medium text-heading mb-2">
            Course not found
          </h3>
          <p className="text-text mb-4">
            The requested course could not be found.
          </p>
          <Link
            to="/courses"
            className="inline-flex items-center text-primary hover:text-primary/65"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  const courseData = course.courses || course;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between relative">
        <Link
          to="/courses"
          className="inline-flex items-center text-primary hover:text-primary/65"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Link>

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
        courseId={courseId} // This is from useParams - make sure it's defined
        sections={sections}
        onRefresh={fetchCourseData}
      />
    </div>
  );
};

export default CourseDetail;
