// frontend/src/components/course/sections/edit/ChaptersSidebar.jsx
import { Plus, FileText, Layers, AlertCircle, AlertTriangle, Clock } from "lucide-react";
import DraggableChapterList from "./DraggableChapterList";

export default function ChaptersSidebar({
  sectionId,
  chapters,
  selectedChapter,
  activeTab,
  pendingChanges,
  onChapterSelect,
  onSectionSelect,
  onChapterCreate,
  onChapterDelete,
  onChapterUndoDelete,
  onChapterRestoreArchived,
  onReorderChapters,
}) {
  const selectedChapterId = selectedChapter
    ? (selectedChapter.chapters || selectedChapter).chapterId
    : null;

  // Count different states
  const activeChapterCount = chapters.filter(ch => !ch.pendingDeletion && !(ch.chapters || ch).isArchived).length;
  const pendingDeletionCount = pendingChanges.deleted.length;
  const scheduledDeletionCount = chapters.filter(ch => {
    const data = ch.chapters || ch;
    return data.isArchived && (data.purgeAfterAt || data.scheduledDeleteAt);
  }).length;
  const archivedCount = chapters.filter(ch => {
    const data = ch.chapters || ch;
    return data.isArchived && !(data.purgeAfterAt || data.scheduledDeleteAt);
  }).length;

  // Total change count
  const changeCount =
    pendingChanges.added.length +
    pendingChanges.modified.length +
    pendingChanges.deleted.length;

  return (
    <div className="w-80 bg-bg border-r border-border-primary flex flex-col h-full">
      {/* Section Header */}
      <div className="p-4 border-b border-border-primary">
        <button
          onClick={onSectionSelect}
          className={`w-full text-left p-3 rounded-lg transition-colors ${
            activeTab === "section"
              ? "bg-primary/10 text-primary border border-primary/20"
              : "hover:bg-bg2"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded bg-primary/10">
              <Layers className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-heading text-sm">
                Section Settings
              </div>
              <div className="text-xs text-text/70">
                Title, description, media
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Chapters Header */}
      <div className="p-4 border-b border-border-primary">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-heading">
            Chapters ({activeChapterCount})
          </h3>
          <button
            onClick={onChapterCreate}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>

        {changeCount > 0 && (
          <div className="text-xs text-orange-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {changeCount} unsaved change{changeCount !== 1 ? "s" : ""}
          </div>
        )}

        {pendingDeletionCount > 0 && (
          <div className="text-xs text-red-600 flex items-center gap-1 mt-1">
            <AlertTriangle className="w-3 h-3" />
            {pendingDeletionCount} chapter{pendingDeletionCount !== 1 ? "s" : ""} marked for deletion
          </div>
        )}

        {scheduledDeletionCount > 0 && (
          <div className="text-xs text-orange-600 flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3" />
            {scheduledDeletionCount} scheduled for deletion
          </div>
        )}

        {pendingChanges.reordered && (
          <div className="text-xs text-orange-600 mt-1">
            Chapter order changed
          </div>
        )}
      </div>

      {/* Chapters List */}
      <div className="flex-1 overflow-y-auto p-2">
        {chapters.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 mx-auto text-text/40 mb-2" />
            <p className="text-sm text-text/60 mb-3">No chapters yet</p>
            <button
              onClick={onChapterCreate}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Create First Chapter
            </button>
          </div>
        ) : (
          <DraggableChapterList
            chapters={chapters}
            selectedChapter={selectedChapter}
            pendingChanges={pendingChanges}
            onChapterSelect={onChapterSelect}
            onChapterDelete={onChapterDelete}
            onChapterUndoDelete={onChapterUndoDelete}
            onRestoreArchived={onChapterRestoreArchived}
            onReorderChapters={onReorderChapters}
          />
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border-primary">
        <div className="text-xs text-text/60 text-center">
          {activeChapterCount} active chapter{activeChapterCount !== 1 ? "s" : ""}
          {scheduledDeletionCount > 0 && (
            <div className="mt-1 text-orange-600">
              {scheduledDeletionCount} scheduled for deletion
            </div>
          )}
          {pendingDeletionCount > 0 && (
            <div className="mt-1 text-red-600">
              {pendingDeletionCount} pending deletion
            </div>
          )}
          {archivedCount > 0 && (
            <div className="mt-1 text-yellow-600">
              {archivedCount} archived
            </div>
          )}
          {chapters.length > 0 && !pendingDeletionCount && !archivedCount && !scheduledDeletionCount && (
            <>
              <div className="mt-1 text-text/40">Drag chapters to reorder</div>
            </>
          )}
          {changeCount > 0 && (
            <div className="mt-1 text-orange-600">
              Remember to save changes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}