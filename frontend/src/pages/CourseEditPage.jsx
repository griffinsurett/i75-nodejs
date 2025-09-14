import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Loader2, AlertCircle } from "lucide-react";
import { courseAPI } from "../services/api";
import CourseForm from "../components/CourseForm";

export default function CourseEditPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const r = await courseAPI.getCourse(courseId);
        if (r.data?.success) setCourse(r.data.data);
        else setErr("Failed to fetch course");
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to fetch course");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 text-text/70">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  if (err || !course) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center text-red-600 mb-4">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{err || "Course not found"}</span>
        </div>
        <Link to="/courses" className="inline-flex items-center text-primary hover:text-primary/65">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link to={`/courses/${courseId}`} className="inline-flex items-center text-primary hover:text-primary/65">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </Link>
      </div>

      <div className="bg-bg rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Edit className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold text-heading">Edit Course</h1>
        </div>
        <CourseForm mode="edit" course={course} />
      </div>
    </div>
  );
}
