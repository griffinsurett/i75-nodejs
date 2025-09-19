// frontend/src/components/course/sections/SectionDetail.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { sectionAPI } from "../../../services/api";
import { FileText, Loader2, AlertCircle } from "lucide-react";
import EditActions from "../../archive/EditActions";
import SectionHeader from "./SectionHeader";
import SectionChapters from "./chapters/SectionChapters";
import BackButton from "../../navigation/BackButton";

const SectionDetail = () => {
  const { courseId, sectionId } = useParams();
  const [section, setSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSectionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await sectionAPI.getSection(sectionId);

      if (response.data.success) {
        setSection(response.data.data);
      } else {
        throw new Error("Failed to fetch section details");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch section data"
      );
      console.error("Error fetching section data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sectionId) fetchSectionData();
  }, [sectionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-text/70">Loading section details...</span>
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
          <BackButton to={`/courses/${courseId}`}>Back to Course</BackButton>
        </div>
      </div>
    );
  }

  if (!section) return null;

  const sectionData = section.sections || section;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <BackButton to={`/courses/${courseId || sectionData.courseId}`}>
          Back to Course
        </BackButton>

        <EditActions
          id={sectionData.sectionId}
          isArchived={sectionData.isArchived}
          editTo={`/sections/${sectionData.sectionId}/edit`}
          entityName="section"
          api={{
            archive: sectionAPI.archiveSection,
            restore: sectionAPI.restoreSection,
            delete: sectionAPI.deleteSection,
          }}
          onChanged={fetchSectionData}
        />
      </div>

      <SectionHeader section={section} />
      <SectionChapters section={section} onRefresh={fetchSectionData} />
    </div>
  );
};

export default SectionDetail;