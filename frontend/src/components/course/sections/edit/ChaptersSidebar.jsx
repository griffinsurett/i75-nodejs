// frontend/src/components/course/sections/edit/ChaptersSidebar.jsx
import { useState } from 'react';
import { Plus, FileText, Layers, MoreVertical, Trash2, Edit } from 'lucide-react';
import ActionsMenu from '../../../ActionsMenu';
import ConfirmModal from '../../../ConfirmModal';
import { sectionAPI } from '../../../../services/api';

export default function ChaptersSidebar({
  sectionId,
  chapters,
  selectedChapter,
  activeTab,
  onChapterSelect,
  onSectionSelect,
  onChapterCreate,
  onChapterDelete,
  onChapterUpdate,
}) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateChapter = async () => {
    try {
      setLoading(true);
      setError('');

      // Don't calculate chapter number - let backend handle it
      const newChapterData = {
        title: `New Chapter`,
        description: '',
        content: '',
        // chapterNumber is omitted - backend will auto-assign
      };

      const response = await sectionAPI.createSectionChapter(sectionId, newChapterData);
      if (response.data?.success) {
        const newChapter = response.data.data;
        // Update the title to include the auto-assigned number if generic
        if (!newChapter.title || newChapter.title === 'New Chapter') {
          newChapter.title = `Chapter ${newChapter.chapterNumber}`;
        }
        onChapterCreate(newChapter);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create chapter');
      console.error('Error creating chapter:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChapter = async () => {
    if (!chapterToDelete) return;

    try {
      setLoading(true);
      setError('');

      const chapterData = chapterToDelete.chapters || chapterToDelete;
      await sectionAPI.deleteSectionChapter(sectionId, chapterData.chapterId);
      
      onChapterDelete(chapterData.chapterId);
      setDeleteModalOpen(false);
      setChapterToDelete(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete chapter');
      console.error('Error deleting chapter:', err);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (chapter) => {
    setChapterToDelete(chapter);
    setDeleteModalOpen(true);
  };

  const selectedChapterId = selectedChapter ? (selectedChapter.chapters || selectedChapter).chapterId : null;

  return (
    <>
      <div className="w-80 bg-bg border-r border-border-primary flex flex-col h-full">
        {/* Section Header */}
        <div className="p-4 border-b border-border-primary">
          <button
            onClick={onSectionSelect}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              activeTab === 'section'
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'hover:bg-bg2'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded bg-primary/10">
                <Layers className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-heading text-sm">Section Settings</div>
                <div className="text-xs text-text/70">Title, description, media</div>
              </div>
            </div>
          </button>
        </div>

        {/* Chapters Header */}
        <div className="p-4 border-b border-border-primary">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-heading">Chapters</h3>
            <button
              onClick={handleCreateChapter}
              disabled={loading}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
          
          {error && (
            <div className="text-xs text-red-600 mb-2">{error}</div>
          )}
        </div>

        {/* Chapters List */}
        <div className="flex-1 overflow-y-auto">
          {chapters.length === 0 ? (
            <div className="p-4 text-center">
              <FileText className="w-8 h-8 mx-auto text-text/40 mb-2" />
              <p className="text-sm text-text/60 mb-3">No chapters yet</p>
              <button
                onClick={handleCreateChapter}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Create First Chapter
              </button>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {chapters
                .sort((a, b) => {
                  const aNum = (a.chapters || a).chapterNumber || (a.chapterNumber) || 0;
                  const bNum = (b.chapters || b).chapterNumber || (b.chapterNumber) || 0;
                  return aNum - bNum;
                })
                .map((chapter, index) => {
                  const chapterData = chapter.chapters || chapter;
                  const isSelected = chapterData.chapterId === selectedChapterId;
                  
                  return (
                    <div
                      key={chapterData.chapterId}
                      className={`group relative rounded-lg border transition-colors ${
                        isSelected
                          ? 'bg-primary/10 border-primary/20 text-primary'
                          : 'border-transparent hover:bg-bg2 hover:border-border-primary'
                      }`}
                    >
                      <button
                        onClick={() => onChapterSelect(chapter)}
                        className="w-full text-left p-3 rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded text-xs font-medium flex items-center justify-center flex-shrink-0 ${
                            isSelected 
                              ? 'bg-primary text-white' 
                              : 'bg-bg2 text-text'
                          }`}>
                            {chapterData.chapterNumber}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className={`text-sm font-medium truncate ${
                              isSelected ? 'text-primary' : 'text-heading'
                            }`}>
                              {chapterData.title || `Chapter ${chapterData.chapterNumber}`}
                            </div>
                            {chapterData.description && (
                              <div className="text-xs text-text/60 truncate mt-0.5">
                                {chapterData.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Chapter Actions */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ActionsMenu
                          items={[
                            {
                              label: 'Delete',
                              icon: Trash2,
                              danger: true,
                              onClick: () => openDeleteModal(chapter),
                            },
                          ]}
                          buttonClassName="w-6 h-6 bg-bg/80 backdrop-blur hover:bg-bg2"
                          menuClassName="w-32"
                          ariaLabel={`Actions for ${chapterData.title}`}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-primary">
          <div className="text-xs text-text/60 text-center">
            {chapters.length} chapter{chapters.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setChapterToDelete(null);
        }}
        title="Delete Chapter?"
        description={`Are you sure you want to delete "${(chapterToDelete?.chapters || chapterToDelete)?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Chapter"
        confirmClass="bg-red-600"
        onConfirm={handleDeleteChapter}
        busy={loading}
        error={error}
      />
    </>
  );
}