import { useState } from 'react';
import { FileText, Play, Plus, ChevronRight } from 'lucide-react';
import ActiveArchivedTabs from '../../../archive/ActiveArchivedTabs';
import ArchivedNotice from '../../../archive/ArchivedNotice';
import ArchiveBadge from '../../../archive/ArchiveBadge';
import EditActions from '../../../archive/EditActions';
import ChapterFormModal from './ChapterFormModal';

export default function SectionChapters({ section, onRefresh }) {
  const [view, setView] = useState('active');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  
  const sectionData = section.sections || section;
  const chapters = sectionData.chapters || [];

  const handleEdit = (chapter) => {
    setEditingChapter(chapter);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingChapter(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    if (onRefresh) onRefresh();
  };

  // Filter chapters based on view
  const activeChapters = chapters.filter(c => !(c.chapters || c).isArchived);
  const archivedChapters = chapters.filter(c => (c.chapters || c).isArchived);
  const displayedChapters = view === 'archived' ? archivedChapters : activeChapters;
  const chapterCount = view === 'archived' ? archivedChapters.length : activeChapters.length;

  return (
    <div className="bg-bg rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-heading flex items-center">
            <FileText className="w-6 h-6 mr-2" />
            Chapters ({chapterCount})
          </h2>
          <ActiveArchivedTabs 
            value={view} 
            onChange={setView} 
            className="ml-2"
            activeLabel="Active"
            archivedLabel="Archived"
          />
        </div>
        
        <button 
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Chapter
        </button>
      </div>

      {view === 'archived' && displayedChapters.length > 0 && <ArchivedNotice />}

      {displayedChapters.length > 0 ? (
        <div className="space-y-4">
          {displayedChapters.map((chapter) => {
            const chapterData = chapter.chapters || chapter;
            const chapterVideo = chapter.videos;
            
            return (
              <div
                key={chapterData.chapterId}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  view === 'archived' 
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' 
                    : 'border-border-primary'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-heading">
                        Chapter {chapterData.chapterNumber}: {chapterData.title}
                      </h3>
                      {view === 'archived' && (
                        <ArchiveBadge
                          archivedAt={chapterData.archivedAt}
                          scheduledDeleteAt={chapterData.purgeAfterAt}
                        />
                      )}
                    </div>

                    <p className="text-text text-sm mb-3">
                      {chapterData.description || 'No description available'}
                    </p>

                    {chapterVideo?.title && (
                      <div className="flex items-center text-sm text-text/70 mb-3">
                        <Play className="w-4 h-4 mr-1" />
                        <span>{chapterVideo.title}</span>
                      </div>
                    )}

                    <button className="inline-flex items-center text-primary hover:text-primary/65 text-sm font-medium">
                      View Chapter Content
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>

                  <div className="ml-4">
                    <EditActions
                      id={chapterData.chapterId}
                      isArchived={chapterData.isArchived || false}
                      onEdit={() => handleEdit(chapter)}
                      entityName="chapter"
                      api={{
                        // You'll need to implement these in your API
                        archive: () => Promise.resolve(),
                        restore: () => Promise.resolve(),
                        delete: () => Promise.resolve(),
                      }}
                      onChanged={onRefresh}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 mx-auto text-text/70 mb-4" />
          <h3 className="text-lg font-medium text-heading mb-2">
            {view === 'archived' ? 'No archived chapters' : 'No chapters yet'}
          </h3>
          <p className="text-text mb-4">
            {view === 'archived' 
              ? 'Archived chapters you hide will appear here.'
              : 'Create your first chapter to add content to this section.'}
          </p>
          {view === 'active' && (
            <button 
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-bg px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create First Chapter
            </button>
          )}
        </div>
      )}

      {/* Chapter Form Modal */}
      <ChapterFormModal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        sectionId={sectionData.sectionId}
        chapter={editingChapter}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}