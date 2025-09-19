// frontend/src/pages/SectionUpsertPage.jsx
import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Edit, Plus, Loader2, AlertCircle } from "lucide-react";
import { sectionAPI } from "../services/api";
import SectionForm from "../components/course/sections/SectionForm";

export default function SectionUpsertPage() {
  const { sectionId } = useParams();
  const location = useLocation();
  const isEdit = Boolean(sectionId);
  
  // Get courseId from URL params when creating
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

  // Determine the back link
  const getBackLink = () => {
    if (isEdit && section) {
      // For edit: go back to the section detail page
      const courseId = section.sections?.courseId || section.courseId;
      return `/courses/${courseId}/sections/${sectionId}`;
    } else if (courseIdFromUrl) {
      // For create from course: go back to the course
      return `/courses/${courseIdFromUrl}`;
    } else {
      // Fallback to sections list
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
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 text-text/70">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  if (isEdit && (err || !section)) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center text-red-600 mb-4">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{err || "Section not found"}</span>
        </div>
        <Link
          to="/sections"
          className="inline-flex items-center text-primary hover:text-primary/65"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sections
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to={getBackLink()}
          className="inline-flex items-center text-primary hover:text-primary/65"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {getBackText()}
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