// frontend/src/components/course/sections/lists/SectionList.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { sectionAPI } from "../../../../services/api";
import { Plus } from "lucide-react";
import ActiveArchivedTabs from "../../../archive/ActiveArchivedTabs";
import ArchivedNotice from "../../../archive/ArchivedNotice";
import useArchiveViewParam from "../../../archive/hooks/useArchiveViewParam";
import SectionCard from "../cards/SectionCard";
import SectionEmptyState from "../detail/SectionEmptyState";
import PageLoadingState from "../../../common/PageLoadingState";
import PageErrorState from "../../../common/PageErrorState";

const SectionList = () => {
  const navigate = useNavigate();
  const [view, setView] = useArchiveViewParam();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSections = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res =
        view === "archived"
          ? await sectionAPI.getAllSections({ archived: "true" })
          : await sectionAPI.getAllSections();

      if (res.data?.success) setSections(res.data.data || []);
      else setError("Failed to fetch sections");
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to fetch sections");
      console.error("Error fetching sections:", e);
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  if (loading) {
    return <PageLoadingState message="Loading sections..." />;
  }

  if (error) {
    return <PageErrorState error={error} />;
  }

  const isArchivedView = view === "archived";
  const handleAddSection = () => navigate("/sections/new");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-heading">
            {isArchivedView ? "Archived Sections" : "Course Sections"}
          </h1>
          <ActiveArchivedTabs
            value={view}
            onChange={setView}
            className="ml-2"
          />
        </div>

        <button
          onClick={handleAddSection}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Section
        </button>
      </div>

      {isArchivedView && <ArchivedNotice />}

      {/* Content */}
      {sections.length === 0 ? (
        <SectionEmptyState
          isArchived={isArchivedView}
          onAddSection={handleAddSection}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <SectionCard
              key={section.sections?.sectionId || section.sectionId}
              section={section}
              onChanged={fetchSections}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SectionList;