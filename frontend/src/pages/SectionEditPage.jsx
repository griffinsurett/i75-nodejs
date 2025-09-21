// frontend/src/pages/SectionEditPage.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2, AlertCircle, Save } from "lucide-react";
import { sectionAPI } from "../services/api";
import BackButton from "../components/navigation/BackButton";
import ChaptersSidebar from "../components/course/sections/edit/ChaptersSidebar";
import SectionEditor from "../components/course/sections/edit/SectionEditor";
import ChapterEditor from "../components/course/sections/edit/ChapterEditor";

export default function SectionEditPage() {
  const { sectionId } = useParams();
  const [section, setSection] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [activeTab, setActiveTab] = useState('section'); // 'section' or 'chapter'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const fetchSectionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await sectionAPI.getSection(sectionId);
      if (response.data.success) {
        const sectionData = response.data.data;
        setSection(sectionData);
        
        // Extract chapters from section data
        const sectionInfo = sectionData.sections || sectionData;
        const chaptersData = sectionInfo.chapters || [];
        setChapters(chaptersData);
        
        // Auto-select first chapter if available
        if (chaptersData.length > 0 && !selectedChapter) {
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
    if (sectionId) fetchSectionData();
  }, [sectionId]);

  const handleChapterSelect = (chapter) => {
    setSelectedChapter(chapter);
    setActiveTab('chapter');
  };

  const handleSectionSelect = () => {
    setSelectedChapter(null);
    setActiveTab('section');
  };

  const handleChapterUpdate = (updatedChapter) => {
    setChapters(prev => 
      prev.map(chapter => 
        (chapter.chapters || chapter).chapterId === (updatedChapter.chapters || updatedChapter).chapterId 
          ? updatedChapter 
          : chapter
      )
    );
    setSelectedChapter(updatedChapter);
    setHasUnsavedChanges(false);
  };

  const handleChapterCreate = (newChapter) => {
    setChapters(prev => [...prev, newChapter]);
    setSelectedChapter(newChapter);
    setActiveTab('chapter');
  };

  const handleChapterDelete = (deletedChapterId) => {
    setChapters(prev => 
      prev.filter(chapter => 
        (chapter.chapters || chapter).chapterId !== deletedChapterId
      )
    );
    
    // If deleted chapter was selected, clear selection
    if (selectedChapter && (selectedChapter.chapters || selectedChapter).chapterId === deletedChapterId) {
      setSelectedChapter(null);
      setActiveTab('section');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-text/70">Loading section...</span>
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
          
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-orange-600">
              <Save className="w-4 h-4" />
              <span className="text-sm">Unsaved changes</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Chapters Sidebar */}
        <ChaptersSidebar
          sectionId={sectionId}
          chapters={chapters}
          selectedChapter={selectedChapter}
          activeTab={activeTab}
          onChapterSelect={handleChapterSelect}
          onSectionSelect={handleSectionSelect}
          onChapterCreate={handleChapterCreate}
          onChapterDelete={handleChapterDelete}
          onChapterUpdate={handleChapterUpdate}
        />

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {activeTab === 'section' ? (
              <SectionEditor
                section={section}
                onUpdate={(updatedSection) => {
                  setSection(updatedSection);
                  setHasUnsavedChanges(false);
                }}
                onDataChange={() => setHasUnsavedChanges(true)}
              />
            ) : selectedChapter ? (
              <ChapterEditor
                sectionId={sectionId}
                chapter={selectedChapter}
                onUpdate={handleChapterUpdate}
                onDelete={() => handleChapterDelete((selectedChapter.chapters || selectedChapter).chapterId)}
                onDataChange={() => setHasUnsavedChanges(true)}
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