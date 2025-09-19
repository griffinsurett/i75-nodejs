// frontend/src/pages/CourseUpsertPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Edit, Plus, Loader2, AlertCircle } from "lucide-react";
import { courseAPI } from "../services/api";
import CourseForm from "../components/course/CourseForm";
import BackButton from "../components/navigation/BackButton";

export default function CourseUpsertPage() {
  const { courseId } = useParams();
  const isEdit = Boolean(courseId);

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!isEdit) return;
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
  }, [isEdit, courseId]);

  if (isEdit && loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 text-text/70">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  if (isEdit && (err || !course)) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center text-red-600 mb-4">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{err || "Course not found"}</span>
        </div>
        <BackButton to="/courses">Back to Courses</BackButton>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <BackButton to={isEdit ? `/courses/${courseId}` : "/courses"}>
          {isEdit ? "Back to Course" : "Back to Courses"}
        </BackButton>
      </div>

      <div className="bg-bg rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          {isEdit ? (
            <Edit className="w-5 h-5 text-primary" />
          ) : (
            <Plus className="w-5 h-5 text-primary" />
          )}
          <h1 className="text-2xl font-bold text-heading">
            {isEdit ? "Edit Course" : "Add Course"}
          </h1>
        </div>

        <CourseForm
          mode={isEdit ? "edit" : "create"}
          course={isEdit ? course : undefined}
        />
      </div>
    </div>
  );
}