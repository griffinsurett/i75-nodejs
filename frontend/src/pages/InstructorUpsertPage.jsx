// frontend/src/pages/InstructorUpsertPage.jsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Plus, Loader2, AlertCircle } from "lucide-react";
import { instructorAPI } from "../services/api";
import InstructorForm from "../components/instructor/InstructorForm";

export default function InstructorUpsertPage() {
  const { instructorId } = useParams();
  const isEdit = Boolean(instructorId);

  const [instructor, setInstructor] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const r = await instructorAPI.getInstructor(instructorId);
        if (r.data?.success) setInstructor(r.data.data);
        else setErr("Failed to fetch instructor");
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to fetch instructor");
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, instructorId]);

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

  if (isEdit && (err || !instructor)) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center text-red-600 mb-4">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{err || "Instructor not found"}</span>
        </div>
        <Link
          to="/instructors"
          className="inline-flex items-center text-primary hover:text-primary/65"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Instructors
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to={isEdit ? `/instructors/${instructorId}` : "/instructors"}
          className="inline-flex items-center text-primary hover:text-primary/65"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isEdit ? "Back to Profile" : "Back to Instructors"}
        </Link>
      </div>

      <div className="bg-bg rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          {isEdit ? (
            <Edit className="w-5 h-5 text-primary" />
          ) : (
            <Plus className="w-5 h-5 text-primary" />
          )}
          <h1 className="text-2xl font-bold text-heading">
            {isEdit ? "Edit Instructor" : "Add Instructor"}
          </h1>
        </div>

        <InstructorForm
          mode={isEdit ? "edit" : "create"}
          instructor={isEdit ? instructor : undefined}
        />
      </div>
    </div>
  );
}
