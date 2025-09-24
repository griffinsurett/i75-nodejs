// frontend/src/pages/InstructorUpsertPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Edit, Plus } from "lucide-react";
import { instructorAPI } from "../services/api";
import InstructorForm from "../components/instructor/forms/InstructorForm";
import BackButton from "../components/navigation/BackButton";
import PageLoadingState from "../components/common/PageLoadingState";
import PageErrorState from "../components/common/PageErrorState";

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
    return <PageLoadingState message="Loading instructor..." />;
  }

  if (isEdit && (err || !instructor)) {
    return (
      <PageErrorState
        error={err || "Instructor not found"}
        backUrl="/instructors"
        backLabel="Back to Instructors"
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <BackButton
          to={isEdit ? `/instructors/${instructorId}` : "/instructors"}
        >
          {isEdit ? "Back to Profile" : "Back to Instructors"}
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
