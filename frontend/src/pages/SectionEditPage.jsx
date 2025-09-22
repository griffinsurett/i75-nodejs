// frontend/src/pages/SectionEditPage.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2, AlertCircle, Save, Check } from "lucide-react";
import { sectionAPI } from "../services/api";
import BackButton from "../components/navigation/BackButton";
import ChaptersSidebar from "../components/course/sections/edit/ChaptersSidebar";
import SectionEditor from "../components/course/sections/edit/SectionEditor";
import ChapterEditor from "../components/course/sections/edit/ChapterEditor";
import useChapterChanges from "../hooks/useChapterChanges";
import { getDefaultNextChapterNumber } from "../utils/chapterUtils";

export default function SectionEditPage() {
  const { sectionId } = useParams();
  const [section, setSection] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [activeTab, setActiveTab] = useState('section');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [sectionChanges, setSectionChanges] = useState(false);

  // Use the chapter changes hook
  const {
    chapters,
    pendingChanges,
    addChapter,
    updateChapter,
    deleteChapter,
    reorderChapters,
    hasChanges,
    getChanges,
    reset: resetChapters
  } = useChapterChanges([]);

  const fetchSectionData = async (keepSelection = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await sectionAPI.getSection(sectionId);
      if (response.data.success) {
        const sectionData = response.data.data;
        setSection(sectionData);
        
        // Initialize chapters
        const sectionInfo = sectionData.sections || sectionData;
        const chaptersData = sectionInfo.chapters || [];
        resetChapters(chaptersData);
        
        // Update selected chapter if it exists in the new data
        if (keepSelection && selectedChapter) {
          const selectedId = (selectedChapter.chapters || selectedChapter).chapterId;
          // If it was a temp chapter, try to match by title and number
          if (selectedChapter.isTemp) {
            const matchingChapter = chaptersData.find(ch => {
              const chData = ch.chapters || ch;
              return chData.title === selectedChapter.title && 
                     chData.chapterNumber === selectedChapter.chapterNumber;
            });
            if (matchingChapter) {
              setSelectedChapter(matchingChapter);
            } else {
              // Fallback to first chapter or clear selection
              setSelectedChapter(chaptersData[0] || null);
            }
          } else {
            // For existing chapters, find by ID
            const updatedChapter = chaptersData.find(ch => 
              (ch.chapters || ch).chapterId === selectedId
            );
            if (updatedChapter) {
              setSelectedChapter(updatedChapter);
            } else {
              setSelectedChapter(null);
            }
          }
        } else if (!keepSelection && chaptersData.length > 0 && !selectedChapter) {
          // Auto-select first chapter if available and nothing selected
          setSelectedChapter(chaptersData[0]);
          setActiveTab('chapter');
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

  const handleSaveAllChanges = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const changes = getChanges();
      const promises = [];

      // Delete chapters
      for (const chapter of changes.deleted) {
        const chapterData = chapter.chapters || chapter;
        promises.push(
          sectionAPI.deleteSectionChapter(sectionId, chapterData.chapterId)
        );
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
        promises.push(
          sectionAPI.createSectionChapter(sectionId, chapterData)
        );
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
          sectionAPI.updateSectionChapter(sectionId, chapterData.chapterId, updateData)
        );
      }

      // Handle reordering if needed
      if (changes.reordered && !changes.added.length) {
        // Update chapter numbers for all non-temp chapters
        const reorderPromises = changes.currentOrder
          .filter(c => !c.isTemp)
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
      
      // Refresh data after successful save, keeping selection
      await fetchSectionData(true);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setSectionChanges(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to save changes"
      );
      console.error("Error saving changes:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleChapterSelect = (chapter) => {
    setSelectedChapter(chapter);
    setActiveTab('chapter');
  };

  const handleSectionSelect = () => {
    setSelectedChapter(null);
    setActiveTab('section');
  };

  const handleChapterCreate = () => {
    const nextNumber = getDefaultNextChapterNumber(chapters);
    const newChapter = addChapter({
      chapterNumber: nextNumber,
      title: `Chapter ${nextNumber}`,
      description: '',
      content: '',
    });
    setSelectedChapter(newChapter);
    setActiveTab('chapter');
  };

  const handleChapterUpdate = (chapterId, updates) => {
    updateChapter(chapterId, updates);
    // Update selected chapter if it's the one being edited
    if (selectedChapter && (selectedChapter.chapters || selectedChapter).chapterId === chapterId) {
      const updatedChapter = chapters.find(c => (c.chapters || c).chapterId === chapterId);
      if (updatedChapter) {
        setSelectedChapter({
          ...updatedChapter,
          ...(updatedChapter.chapters ? { chapters: { ...updatedChapter.chapters, ...updates } } : updates)
        });
      }
    }
  };

  const handleChapterDelete = (chapterId) => {
    deleteChapter(chapterId);
    // Clear selection if deleted chapter was selected
    if (selectedChapter && (selectedChapter.chapters || selectedChapter).chapterId === chapterId) {
      setSelectedChapter(null);
      setActiveTab('section');
    }
  };

  const handleSectionUpdate = (updatedSection) => {
    setSection(updatedSection);
    setSectionChanges(true);
  };

  const hasUnsavedChanges = hasChanges() || sectionChanges;

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasUnsavedChanges && !saving) {
          handleSaveAllChanges();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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

  return (
    <div className="min-h-screen bg-bg2">
      {/* Header */}
      <div className="bg-bg border-b border-border-primary px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton to={`/courses/${courseId}/sections/${sectionId}`}>
              Back to Section
            </BackButton>
            <div>
              <h1 className="text-xl font-bold text-heading">
                Edit: {sectionData.title}
              </h1>
              <p className="text-sm text-text/70">
                {chapters.length} chapter{chapters.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <div className="flex items-center gap-2 text-green-600 animate-fade-in">
                <Check className="w-4 h-4" />
                <span className="text-sm">Saved successfully!</span>
              </div>
            )}
            
            {error && (
              <div className="text-red-600 text-sm max-w-xs truncate" title={error}>
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
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-bg2 text-text/60 cursor-not-allowed'
              }`}
              title={hasUnsavedChanges ? 'Save all changes (Ctrl+S)' : 'No changes to save'}
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
          pendingChanges={pendingChanges}
          onChapterSelect={handleChapterSelect}
          onSectionSelect={handleSectionSelect}
          onChapterCreate={handleChapterCreate}
          onChapterDelete={handleChapterDelete}
          onReorderChapters={reorderChapters}
        />

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {activeTab === 'section' ? (
              <SectionEditor
                section={section}
                onUpdate={handleSectionUpdate}
                hasUnsavedChanges={sectionChanges}
              />
            ) : selectedChapter ? (
              <ChapterEditor
                sectionId={sectionId}
                chapter={selectedChapter}
                chapters={chapters}
                onUpdate={(updates) => {
                  const chapterId = (selectedChapter.chapters || selectedChapter).chapterId;
                  handleChapterUpdate(chapterId, updates);
                }}
                onDelete={() => {
                  const chapterId = (selectedChapter.chapters || selectedChapter).chapterId;
                  handleChapterDelete(chapterId);
                }}
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