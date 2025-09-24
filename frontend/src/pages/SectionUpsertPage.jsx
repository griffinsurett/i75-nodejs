// frontend/src/pages/SectionUpsertPage.jsx
import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Edit, Plus } from "lucide-react";
import { sectionAPI } from "../services/api";
import SectionForm from "../components/course/sections/forms/SectionForm";
import BackButton from "../components/navigation/BackButton";
import PageLoadingState from "../components/common/PageLoadingState";
import PageErrorState from "../components/common/PageErrorState";

export default function SectionUpsertPage() {
  const { sectionId } = useParams();
  const location = useLocation();
  const isEdit = Boolean(sectionId);
  
  const urlParams = new URLSearchParams(location.search);
  const courseIdFromUrl = urlParams.get('courseId');

  const [section, setSection] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const r = await sectionAPI.getSection(sectionId);
        if (r.data?.success) setSection(r.data.data);
        else setErr("Failed to fetch section");
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to fetch section");
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, sectionId]);

  const getBackLink = () => {
    if (isEdit && section) {
      const courseId = section.sections?.courseId || section.courseId;
      return `/courses/${courseId}/sections/${sectionId}`;
    } else if (courseIdFromUrl) {
      return `/courses/${courseIdFromUrl}`;
    } else {
      return "/sections";
    }
  };

  const getBackText = () => {
    if (isEdit) {
      return "Back to Section";
    } else if (courseIdFromUrl) {
      return "Back to Course";
    } else {
      return "Back to Sections";
    }
  };

  if (isEdit && loading) {
    return <PageLoadingState message="Loading section..." />;
  }

  if (isEdit && (err || !section)) {
    return (
      <PageErrorState 
        error={err || "Section not found"} 
        backUrl="/sections" 
        backLabel="Back to Sections" 
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <BackButton to={getBackLink()}>{getBackText()}</BackButton>
      </div>

      <div className="bg-bg rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          {isEdit ? (
            <Edit className="w-5 h-5 text-primary" />
          ) : (
            <Plus className="w-5 h-5 text-primary" />
          )}
          <h1 className="text-2xl font-bold text-heading">
            {isEdit ? "Edit Section" : "Add Section"}
          </h1>
        </div>

        <SectionForm
          mode={isEdit ? "edit" : "create"}
          section={isEdit ? section : undefined}
        />
      </div>
    </div>
  );
}