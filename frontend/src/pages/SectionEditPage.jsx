// frontend/src/pages/SectionEditPage.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Loader2, AlertCircle, Save, Check } from "lucide-react";
import { sectionAPI, chapterAPI } from "../services/api";
import BackButton from "../components/navigation/BackButton";
import ChaptersSidebar from "../components/course/sections/content-editor/sidebar/ChaptersSidebar";
import SectionEditor from "../components/course/sections/content-editor/SectionEditor";
import ChapterEditor from "../components/course/sections/content-editor/chapter/ChapterEditor";
import useChapterChanges from "../components/course/sections/hooks/useChapterChanges";
import { getDefaultNextChapterNumber } from "../components/course/sections/utils/chapterUtils";
import { useSidebar } from "../context/SidebarContext";

export default function SectionEditPage() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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

  // Track if we should block navigation
  const [isBlocking, setIsBlocking] = useState(false);

  // Sidebar management
  const { sidebarOpen, closeSidebar, openSidebar } = useSidebar();
  const previousSidebarState = useRef(null);

  // Close sidebar on mount and restore previous state on unmount
  useEffect(() => {
    // Store the current state
    previousSidebarState.current = sidebarOpen;

    // Close the sidebar for this page
    closeSidebar();

    // Restore previous state when leaving the page
    return () => {
      if (previousSidebarState.current) {
        openSidebar();
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

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

  const fetchSectionData = async (
    keepSelection = false,
    includeArchived = true
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Get section with all chapters (including archived)
      const response = await sectionAPI.getSection(sectionId);
      if (response.data.success) {
        const sectionData = response.data.data;
        setSection(sectionData);

        // Initialize chapters - include ALL chapters (active and archived)
        const sectionInfo = sectionData.sections || sectionData;
        const chaptersData = sectionInfo.chapters || [];

        resetChapters(chaptersData);

        // Update selected chapter if it exists in the new data
        if (keepSelection && selectedChapter) {
          const selectedId = (selectedChapter.chapters || selectedChapter)
            .chapterId;
          // If it was a temp chapter, try to match by title and number
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
              // Fallback to first chapter or clear selection
              setSelectedChapter(chaptersData[0] || null);
            }
          } else {
            // For existing chapters, find by ID
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
        // REMOVED: Auto-selection of first chapter on initial load
        // The section settings tab will remain active by default
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

      // Refresh data after restore
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

      // Save section changes if any
      if (hasSectionChanges && sectionFormData) {
        const sectionUpdateData = {
          title: sectionFormData.title?.trim(),
          description: sectionFormData.description?.trim() || undefined,
          imageId: sectionFormData.imageId || undefined,
          videoId: sectionFormData.videoId || undefined,
        };

        promises.push(sectionAPI.updateSection(sectionId, sectionUpdateData));
      }

      // Handle chapter changes
      const changes = getChanges();

      // DELETE chapters (scheduled deletion)
      for (const chapter of changes.deleted) {
        const chapterData = chapter.chapters || chapter;
        promises.push(chapterAPI.deleteChapter(chapterData.chapterId));
      }

      // Create new chapters
      for (const chapter of changes.added) {
        const chapterData = {
          chapterNumber: chapter.chapterNumber,
          title: chapter.title,
          description: chapter.description,
          content: chapter.content,
          imageId: chapter.imageId,
          videoId: chapter.videoId,
        };
        promises.push(sectionAPI.createSectionChapter(sectionId, chapterData));
      }

      // Update modified chapters
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
        promises.push(
          sectionAPI.updateSectionChapter(
            sectionId,
            chapterData.chapterId,
            updateData
          )
        );
      }

      // Handle reordering if needed
      if (changes.reordered && !changes.added.length) {
        const reorderPromises = changes.currentOrder
          .filter((c) => !c.isTemp && !(c.chapters || c).isArchived)
          .map((chapter, index) => {
            const chapterData = chapter.chapters || chapter;
            return sectionAPI.updateSectionChapter(
              sectionId,
              chapterData.chapterId,
              { chapterNumber: index + 1 }
            );
          });
        promises.push(...reorderPromises);
      }

      // Execute all changes
      await Promise.all(promises);

      // Refresh data after successful save
      await fetchSectionData(true);

      // Reset section changes flag
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
    // Get next chapter number based on active chapters only
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
    // Update selected chapter if it's the one being edited
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

    // If the deleted chapter was selected, clear selection
    if (
      selectedChapter &&
      (selectedChapter.chapters || selectedChapter).chapterId === chapterId
    ) {
      // Update the selected chapter to show deletion state
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

    // Update selected chapter if it's the one being restored
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

  // Update the handleSectionUpdate function
  const handleSectionUpdate = (formData) => {
    setSectionFormData(formData);

    // Check if there are actual changes
    const sectionData = section.sections || section;
    const hasChanges =
      formData.title !== sectionData.title ||
      formData.description !== sectionData.description ||
      formData.imageId !== sectionData.imageId ||
      formData.videoId !== sectionData.videoId;

    setHasSectionChanges(hasChanges);
  };

  // Update hasUnsavedChanges to include section changes
  const hasUnsavedChanges = hasChanges() || hasSectionChanges;

  // Update blocking state when unsaved changes state changes
  useEffect(() => {
    setIsBlocking(hasUnsavedChanges);
  }, [hasUnsavedChanges]);

  // Handle browser navigation (reload, close tab, navigate away)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges && !saving) {
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, saving]);

  // Handle React Router navigation
  useEffect(() => {
    if (!isBlocking) return;

    const handleLocationChange = (e) => {
      if (hasUnsavedChanges && !saving) {
        const confirmLeave = window.confirm(
          "You have unsaved changes. Are you sure you want to leave?"
        );
        if (!confirmLeave) {
          e.preventDefault();
          // Push the current location back to prevent navigation
          window.history.pushState(null, "", location.pathname);
        }
      }
    };

    // Listen for popstate events (browser back/forward)
    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, [isBlocking, hasUnsavedChanges, saving, location.pathname]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (hasUnsavedChanges && !saving) {
          handleSaveAllChanges();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hasUnsavedChanges, saving]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-text/70">Loading section...</span>
      </div>
    );
  }

  if (error && !section) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-64 text-red-600">
          <AlertCircle className="w-6 h-6 mr-2" />
          <span>{error}</span>
        </div>
        <div className="mt-4 text-center">
          <BackButton to="/sections">Back to Sections</BackButton>
        </div>
      </div>
    );
  }

  if (!section) return null;

  const sectionData = section.sections || section;
  const courseId = sectionData.courseId;

  // Count active and scheduled for deletion
  const activeChapterCount = chapters.filter(
    (ch) => !ch.pendingDeletion && !(ch.chapters || ch).isArchived
  ).length;
  const archivedCount = chapters.filter(
    (ch) => (ch.chapters || ch).isArchived
  ).length;
  const scheduledForDeletionCount = chapters.filter((ch) => {
    const data = ch.chapters || ch;
    return data.isArchived && (data.purgeAfterAt || data.scheduledDeleteAt);
  }).length;

  return (
    <div className="min-h-screen bg-bg2">
      {/* Header */}
      <div className="bg-bg border-b border-border-primary px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton
              to={`/courses/${courseId}/sections/${sectionId}`}
              confirmNavigation={true}
              confirmCondition={hasUnsavedChanges}
              confirmMessage="You have unsaved changes. Are you sure you want to leave?"
            >
              Back to Section
            </BackButton>
            <div>
              <h1 className="text-xl font-bold text-heading">
                Edit: {sectionData.title}
              </h1>
              <p className="text-sm text-text/70">
                {activeChapterCount} active chapter
                {activeChapterCount !== 1 ? "s" : ""}
                {pendingChanges.deleted.length > 0 && (
                  <span className="text-red-600">
                    {" "}
                    • {pendingChanges.deleted.length} pending deletion
                  </span>
                )}
                {scheduledForDeletionCount > 0 && (
                  <span className="text-orange-600">
                    {" "}
                    • {scheduledForDeletionCount} scheduled for deletion
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {restoringChapter && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Restoring...</span>
              </div>
            )}

            {saveSuccess && (
              <div className="flex items-center gap-2 text-green-600 animate-fade-in">
                <Check className="w-4 h-4" />
                <span className="text-sm">Saved successfully!</span>
              </div>
            )}

            {error && (
              <div
                className="text-red-600 text-sm max-w-xs truncate"
                title={error}
              >
                {error}
              </div>
            )}

            {hasUnsavedChanges && !saveSuccess && (
              <div className="flex items-center gap-2 text-orange-600">
                <Save className="w-4 h-4" />
                <span className="text-sm">Unsaved changes</span>
              </div>
            )}

            <button
              onClick={handleSaveAllChanges}
              disabled={!hasUnsavedChanges || saving}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                hasUnsavedChanges && !saving
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "bg-bg2 text-text/60 cursor-not-allowed"
              }`}
              title={
                hasUnsavedChanges
                  ? "Save all changes (Ctrl+S)"
                  : "No changes to save"
              }
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save All Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Chapters Sidebar */}
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

        {/* Main Content Area */}
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
