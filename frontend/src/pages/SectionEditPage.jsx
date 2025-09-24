// frontend/src/pages/SectionEditPage.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { sectionAPI, chapterAPI } from "../services/api";
import ChaptersSidebar from "../components/course/sections/content-editor/sidebar/ChaptersSidebar";
import SectionEditor from "../components/course/sections/content-editor/SectionEditor";
import ChapterEditor from "../components/course/sections/content-editor/chapter/ChapterEditor";
import useChapterChanges from "../components/course/sections/hooks/useChapterChanges";
import { getDefaultNextChapterNumber } from "../components/course/sections/utils/chapterUtils";
import { useSidebar } from "../context/SidebarContext";

// New reusable components
import EditorHeader from "../components/common/EditorHeader";
import SaveStatusIndicator from "../components/common/SaveStatusIndicator";
import PageLoadingState from "../components/common/PageLoadingState";
import PageErrorState from "../components/common/PageErrorState";
import useUnsavedChangesWarning from "../hooks/useUnsavedChangesWarning";
import useKeyboardSave from "../hooks/useKeyboardSave";

export default function SectionEditPage() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [section, setSection] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [activeTab, setActiveTab] = useState("section");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Track section form data changes
  const [sectionFormData, setSectionFormData] = useState(null);
  const [hasSectionChanges, setHasSectionChanges] = useState(false);
  const [restoringChapter, setRestoringChapter] = useState(false);

  // Sidebar management
  const { sidebarOpen, closeSidebar, openSidebar } = useSidebar();
  const previousSidebarState = useRef(null);

  // Close sidebar on mount and restore previous state on unmount
  useEffect(() => {
    previousSidebarState.current = sidebarOpen;
    closeSidebar();
    return () => {
      if (previousSidebarState.current) {
        openSidebar();
      }
    };
  }, []);

  // Use the chapter changes hook
  const {
    chapters,
    pendingChanges,
    addChapter,
    updateChapter,
    deleteChapter,
    undoDeleteChapter,
    reorderChapters,
    hasChanges,
    getChanges,
    reset: resetChapters,
  } = useChapterChanges([]);

  const fetchSectionData = async (keepSelection = false, includeArchived = true) => {
    try {
      setLoading(true);
      setError(null);

      const response = await sectionAPI.getSection(sectionId);
      if (response.data.success) {
        const sectionData = response.data.data;
        setSection(sectionData);

        const sectionInfo = sectionData.sections || sectionData;
        const chaptersData = sectionInfo.chapters || [];

        resetChapters(chaptersData);

        if (keepSelection && selectedChapter) {
          const selectedId = (selectedChapter.chapters || selectedChapter).chapterId;
          if (selectedChapter.isTemp) {
            const matchingChapter = chaptersData.find((ch) => {
              const chData = ch.chapters || ch;
              return (
                chData.title === selectedChapter.title &&
                chData.chapterNumber === selectedChapter.chapterNumber
              );
            });
            if (matchingChapter) {
              setSelectedChapter(matchingChapter);
            } else {
              setSelectedChapter(chaptersData[0] || null);
            }
          } else {
            const updatedChapter = chaptersData.find(
              (ch) => (ch.chapters || ch).chapterId === selectedId
            );
            if (updatedChapter) {
              setSelectedChapter(updatedChapter);
            } else {
              setSelectedChapter(null);
            }
          }
        }
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
    if (sectionId) fetchSectionData(false);
  }, [sectionId]);

  const handleRestoreArchivedChapter = async (chapter) => {
    try {
      setRestoringChapter(true);
      const chapterData = chapter.chapters || chapter;
      await chapterAPI.restoreChapter(chapterData.chapterId);
      await fetchSectionData(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to restore chapter"
      );
    } finally {
      setRestoringChapter(false);
    }
  };

  const handleSaveAllChanges = async () => {
    try {
      setSaving(true);
      setError(null);

      const promises = [];

      if (hasSectionChanges && sectionFormData) {
        const sectionUpdateData = {
          title: sectionFormData.title?.trim(),
          description: sectionFormData.description?.trim() || undefined,
          imageId: sectionFormData.imageId || undefined,
          videoId: sectionFormData.videoId || undefined,
        };
        promises.push(sectionAPI.updateSection(sectionId, sectionUpdateData));
      }

      const changes = getChanges();

      // Delete chapters using the single route
      for (const chapter of changes.deleted) {
        const chapterData = chapter.chapters || chapter;
        promises.push(chapterAPI.deleteChapter(chapterData.chapterId));
      }

      // Add new chapters using the single route with sectionId in body
      for (const chapter of changes.added) {
        const chapterData = {
          sectionId: parseInt(sectionId), // Include sectionId in the body
          chapterNumber: chapter.chapterNumber,
          title: chapter.title,
          description: chapter.description,
          content: chapter.content,
          imageId: chapter.imageId,
          videoId: chapter.videoId,
        };
        promises.push(chapterAPI.createChapter(chapterData));
      }

      // Update modified chapters using the single route
      for (const chapter of changes.modified) {
        const chapterData = chapter.chapters || chapter;
        const updateData = {
          chapterNumber: chapterData.chapterNumber,
          title: chapterData.title,
          description: chapterData.description,
          content: chapterData.content,
          imageId: chapterData.imageId,
          videoId: chapterData.videoId,
        };
        promises.push(chapterAPI.updateChapter(chapterData.chapterId, updateData));
      }

      // Handle reordering if needed
      if (changes.reordered && !changes.added.length) {
        const chapterIds = changes.currentOrder
          .filter((c) => !c.isTemp && !(c.chapters || c).isArchived)
          .map((chapter) => (chapter.chapters || chapter).chapterId);
        
        promises.push(chapterAPI.reorderChapters(sectionId, chapterIds));
      }

      await Promise.all(promises);
      await fetchSectionData(true);

      setHasSectionChanges(false);
      setSectionFormData(null);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to save changes"
      );
      console.error("Error saving changes:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleChapterSelect = (chapter) => {
    setSelectedChapter(chapter);
    setActiveTab("chapter");
  };

  const handleSectionSelect = () => {
    setSelectedChapter(null);
    setActiveTab("section");
  };

  const handleChapterCreate = () => {
    const activeChapters = chapters.filter(
      (ch) => !ch.pendingDeletion && !(ch.chapters || ch).isArchived
    );
    const nextNumber = getDefaultNextChapterNumber(activeChapters);
    const newChapter = addChapter({
      chapterNumber: nextNumber,
      title: `Chapter ${nextNumber}`,
      description: "",
      content: "",
    });
    setSelectedChapter(newChapter);
    setActiveTab("chapter");
  };

  const handleChapterUpdate = (chapterId, updates) => {
    updateChapter(chapterId, updates);
    if (
      selectedChapter &&
      (selectedChapter.chapters || selectedChapter).chapterId === chapterId
    ) {
      const updatedChapter = chapters.find(
        (c) => (c.chapters || c).chapterId === chapterId
      );
      if (updatedChapter) {
        setSelectedChapter({
          ...updatedChapter,
          ...(updatedChapter.chapters
            ? { chapters: { ...updatedChapter.chapters, ...updates } }
            : updates),
        });
      }
    }
  };

  const handleChapterDelete = (chapter) => {
    const chapterId = (chapter.chapters || chapter).chapterId;
    deleteChapter(chapterId);

    if (
      selectedChapter &&
      (selectedChapter.chapters || selectedChapter).chapterId === chapterId
    ) {
      setSelectedChapter({
        ...chapter,
        pendingDeletion: true,
        deletedAt: Date.now(),
      });
    }
  };

  const handleChapterUndoDelete = (chapter) => {
    const chapterId = (chapter.chapters || chapter).chapterId;
    undoDeleteChapter(chapterId);

    if (
      selectedChapter &&
      (selectedChapter.chapters || selectedChapter).chapterId === chapterId
    ) {
      const restoredChapter = chapters.find(
        (c) => (c.chapters || c).chapterId === chapterId
      );
      if (restoredChapter) {
        const { pendingDeletion, deletedAt, ...cleanChapter } = restoredChapter;
        setSelectedChapter(cleanChapter);
      }
    }
  };

  const handleSectionUpdate = (formData) => {
    setSectionFormData(formData);
    const sectionData = section.sections || section;
    const hasChanges =
      formData.title !== sectionData.title ||
      formData.description !== sectionData.description ||
      formData.imageId !== sectionData.imageId ||
      formData.videoId !== sectionData.videoId;
    setHasSectionChanges(hasChanges);
  };

  const hasUnsavedChanges = hasChanges() || hasSectionChanges;

  // Use the new hooks
  useUnsavedChangesWarning(hasUnsavedChanges, saving);
  useKeyboardSave(handleSaveAllChanges, hasUnsavedChanges && !saving);

  // Loading state
  if (loading) {
    return <PageLoadingState message="Loading section..." />;
  }

  // Error state
  if (error && !section) {
    return (
      <PageErrorState 
        error={error} 
        backUrl="/sections" 
        backLabel="Back to Sections" 
      />
    );
  }

  if (!section) return null;

  const sectionData = section.sections || section;
  const courseId = sectionData.courseId;

  // Count stats
  const activeChapterCount = chapters.filter(
    (ch) => !ch.pendingDeletion && !(ch.chapters || ch).isArchived
  ).length;
  const scheduledForDeletionCount = chapters.filter((ch) => {
    const data = ch.chapters || ch;
    return data.isArchived && (data.purgeAfterAt || data.scheduledDeleteAt);
  }).length;

  // Build subtitle
  const subtitle = (
    <>
      {activeChapterCount} active chapter{activeChapterCount !== 1 ? "s" : ""}
      {pendingChanges.deleted.length > 0 && (
        <span className="text-red-600">
          {" "}• {pendingChanges.deleted.length} pending deletion
        </span>
      )}
      {scheduledForDeletionCount > 0 && (
        <span className="text-orange-600">
          {" "}• {scheduledForDeletionCount} scheduled for deletion
        </span>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-bg2">
      <EditorHeader
        title={`Edit: ${sectionData.title}`}
        subtitle={subtitle}
        backUrl={`/courses/${courseId}/sections/${sectionId}`}
        backLabel="Back to Section"
        hasUnsavedChanges={hasUnsavedChanges}
        saving={saving}
        onSave={handleSaveAllChanges}
      >
        <SaveStatusIndicator
          saving={saving}
          saveSuccess={saveSuccess}
          hasUnsavedChanges={hasUnsavedChanges}
          error={error}
          restoringText={restoringChapter ? "Restoring..." : null}
        />
      </EditorHeader>

      <div className="flex h-[calc(100vh-73px)]">
        <ChaptersSidebar
          sectionId={sectionId}
          chapters={chapters}
          selectedChapter={selectedChapter}
          activeTab={activeTab}
          pendingChanges={{
            ...pendingChanges,
            sectionChanged: hasSectionChanges,
          }}
          onChapterSelect={handleChapterSelect}
          onSectionSelect={handleSectionSelect}
          onChapterCreate={handleChapterCreate}
          onChapterDelete={handleChapterDelete}
          onChapterUndoDelete={handleChapterUndoDelete}
          onChapterRestoreArchived={handleRestoreArchivedChapter}
          onReorderChapters={reorderChapters}
        />

        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {activeTab === "section" ? (
              <SectionEditor section={section} onUpdate={handleSectionUpdate} />
            ) : selectedChapter ? (
              <ChapterEditor
                sectionId={sectionId}
                chapter={selectedChapter}
                chapters={chapters}
                onUpdate={(updates) => {
                  const chapterId = (
                    selectedChapter.chapters || selectedChapter
                  ).chapterId;
                  handleChapterUpdate(chapterId, updates);
                }}
                onDelete={() => handleChapterDelete(selectedChapter)}
                onUndoDelete={() => handleChapterUndoDelete(selectedChapter)}
                onRestoreArchived={() =>
                  handleRestoreArchivedChapter(selectedChapter)
                }
                isTemp={selectedChapter.isTemp}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-text/60">Select a chapter to edit</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}