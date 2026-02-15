// frontend/src/components/course/sections/content-editor/sidebar/ChaptersSidebar.jsx
import { Plus, FileText, Archive } from "lucide-react";
import DraggableChapterList from "./DraggableChapterList";
import ChangeIndicator from "../../../../common/ChangeIndicator";
import ActiveArchivedTabs from "../../../../archive/ActiveArchivedTabs";

export default function ChaptersSidebar({
  sectionId,
  chapters,
  selectedChapter,
  activeTab,
  pendingChanges,
  chapterView,
  onChapterViewChange,
  archivedCount,
  onChapterSelect,
  onSectionSelect,
  onChapterCreate,
  onChapterDelete,
  onChapterUndoDelete,
  onChapterRestoreArchived,
  onChapterPermanentDelete,
  onChapterExpired,
  onReorderChapters,
}) {
  const isArchivedView = chapterView === "archived";

  const activeChapterCount = chapters.filter(
    ch => !ch.pendingDeletion && !(ch.chapters || ch).isArchived
  ).length;

  const pendingDeletionCount = pendingChanges.deleted.length;
  const scheduledDeletionCount = chapters.filter(ch => {
    const data = ch.chapters || ch;
    return data.isArchived && (data.purgeAfterAt || data.scheduledDeleteAt);
  }).length;

  const changesSummary = {
    added: pendingChanges.added.length,
    modified: pendingChanges.modified.length,
    deleted: pendingChanges.deleted.length,
    reordered: pendingChanges.reordered
  };

  // Add section change to the modified count if needed
  if (pendingChanges.sectionChanged) {
    changesSummary.modified = (changesSummary.modified || 0) + 1;
  }

  const totalChangeCount = changesSummary.added + changesSummary.modified + changesSummary.deleted + (changesSummary.reordered ? 1 : 0);

  return (
    <div className="w-80 bg-bg border-r border-border-primary flex flex-col h-full">

      {/* Chapters Header */}
      <div className="p-4 border-b border-border-primary">
        {/* Active/Archived Toggle + Add Button */}
        <div className="flex items-center justify-between">
          <ActiveArchivedTabs
            value={chapterView}
            onChange={onChapterViewChange}
            activeLabel="Active"
            archivedLabel={`Archived${archivedCount > 0 ? ` (${archivedCount})` : ""}`}
          />
          {!isArchivedView && (
            <button
              onClick={onChapterCreate}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          )}
        </div>

        <h3 className="font-medium text-heading mt-3">
          Chapters {!isArchivedView && `(${activeChapterCount})`}
        </h3>

        {!isArchivedView && <ChangeIndicator changes={changesSummary} />}

        {!isArchivedView && pendingChanges.sectionChanged && (
          <div className="text-xs text-orange-600 mt-1">
            Section settings modified
          </div>
        )}
      </div>

      {/* Chapters List */}
      <div className="flex-1 overflow-y-auto p-2">
        {chapters.length === 0 ? (
          <div className="text-center py-8">
            {isArchivedView ? (
              <>
                <Archive className="w-8 h-8 mx-auto text-text/40 mb-2" />
                <p className="text-sm text-text/60">No archived chapters</p>
              </>
            ) : (
              <>
                <FileText className="w-8 h-8 mx-auto text-text/40 mb-2" />
                <p className="text-sm text-text/60 mb-3">No chapters yet</p>
                <button
                  onClick={onChapterCreate}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4" />
                  Create First Chapter
                </button>
              </>
            )}
          </div>
        ) : (
          <DraggableChapterList
            chapters={chapters}
            selectedChapter={selectedChapter}
            pendingChanges={pendingChanges}
            isArchivedView={isArchivedView}
            onChapterSelect={onChapterSelect}
            onChapterDelete={onChapterDelete}
            onChapterUndoDelete={onChapterUndoDelete}
            onRestoreArchived={onChapterRestoreArchived}
            onPermanentDelete={onChapterPermanentDelete}
            onChapterExpired={onChapterExpired}
            onReorderChapters={onReorderChapters}
          />
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border-primary">
        <div className="text-xs text-text/60 text-center">
          {isArchivedView ? (
            <>{chapters.length} archived chapter{chapters.length !== 1 ? "s" : ""}</>
          ) : (
            <>
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
              {chapters.length > 0 && !pendingDeletionCount && !scheduledDeletionCount && (
                <div className="mt-1 text-text/40">Drag chapters to reorder</div>
              )}
              {totalChangeCount > 0 && (
                <div className="mt-1 text-orange-600">
                  Remember to save changes
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
