// frontend/src/components/course/sections/edit/DraggableChapterList.jsx
import { useState, useRef } from 'react';
import { GripVertical, Trash2, RotateCcw, AlertTriangle, Clock } from 'lucide-react';
import { reorderChapters } from '../../../../utils/chapterUtils';
import ChapterDeletionBadge from '../edit/ChapterDeletionBadge';

export default function DraggableChapterList({
  chapters,
  selectedChapter,
  onChapterSelect,
  onChapterDelete,
  onChapterUndoDelete,
  onReorderChapters,
  onRestoreArchived,
  loading = false,
}) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverItem, setDraggedOverItem] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragStart = (e, index, chapter) => {
    const chapterData = chapter.chapters || chapter;
    // Don't allow dragging deleted or archived chapters
    if (chapter.pendingDeletion || chapterData.isArchived) {
      e.preventDefault();
      return;
    }
    
    setDraggedItem({ index, chapter });
    setIsDragging(true);
    
    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true);
    dragImage.style.opacity = '0.5';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setTimeout(() => document.body.removeChild(dragImage), 0);
    
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    dragCounter.current++;
    const chapter = chapters[index];
    const chapterData = chapter.chapters || chapter;
    // Don't allow dropping on deleted or archived chapters
    if (chapter?.pendingDeletion || chapterData?.isArchived) return;
    
    if (draggedItem && draggedItem.index !== index) {
      setDraggedOverItem(index);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDraggedOverItem(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    const chapter = chapters[dropIndex];
    const chapterData = chapter.chapters || chapter;
    // Don't allow dropping on deleted or archived chapters
    if (chapter?.pendingDeletion || chapterData?.isArchived) return;
    
    if (draggedItem && draggedItem.index !== dropIndex) {
      const reorderedChapters = reorderChapters(chapters, draggedItem.index, dropIndex);
      onReorderChapters(reorderedChapters);
    }
    
    resetDragState();
  };

  const handleDragEnd = () => {
    resetDragState();
  };

  const resetDragState = () => {
    setDraggedItem(null);
    setDraggedOverItem(null);
    setIsDragging(false);
    dragCounter.current = 0;
  };

  const selectedChapterId = selectedChapter ? (selectedChapter.chapters || selectedChapter).chapterId : null;

  // Sort chapters: active chapters by number, then pending deletion, then archived
  const sortedChapters = [...chapters].sort((a, b) => {
    const aData = a.chapters || a;
    const bData = b.chapters || b;
    
    // Archived chapters at the very end
    if (aData.isArchived && !bData.isArchived) return 1;
    if (!aData.isArchived && bData.isArchived) return -1;
    
    // Pending deletion after active but before archived
    if (a.pendingDeletion && !b.pendingDeletion && !bData.isArchived) return 1;
    if (!a.pendingDeletion && b.pendingDeletion && !aData.isArchived) return -1;
    
    const aNum = aData.chapterNumber || 0;
    const bNum = bData.chapterNumber || 0;
    return aNum - bNum;
  });

  return (
    <div className="space-y-1">
      {sortedChapters.map((chapter, index) => {
        const chapterData = chapter.chapters || chapter;
        const isSelected = chapterData.chapterId === selectedChapterId;
        const isDraggedOver = draggedOverItem === index;
        const isBeingDragged = draggedItem?.index === index;
        const isPendingDeletion = chapter.pendingDeletion;
        const isArchived = chapterData.isArchived;
        const hasScheduledDeletion = chapterData.purgeAfterAt || chapterData.scheduledDeleteAt;
        
        return (
          <div
            key={chapterData.chapterId}
            draggable={!loading && !isPendingDeletion && !isArchived}
            onDragStart={(e) => handleDragStart(e, index, chapter)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              group relative rounded-lg border transition-all 
              ${isPendingDeletion || isArchived ? 'cursor-not-allowed' : 'cursor-move'}
              ${isBeingDragged ? 'opacity-50 scale-95' : ''}
              ${isDraggedOver ? 'border-primary border-2 bg-primary/5' : ''}
              ${isSelected && !isDraggedOver
                ? isPendingDeletion || (isArchived && hasScheduledDeletion)
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                  : isArchived
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                    : 'bg-primary/10 border-primary/20 text-primary'
                : !isDraggedOver && (isPendingDeletion || (isArchived && hasScheduledDeletion)
                  ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800 opacity-75'
                  : isArchived
                    ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800 opacity-75'
                    : 'border-transparent hover:bg-bg2 hover:border-border-primary')
              }
              ${isDragging && !isBeingDragged ? 'transition-transform' : ''}
            `}
            style={{
              transform: isDraggedOver && !isBeingDragged ? 'translateY(2px)' : '',
            }}
          >
            <div className="flex items-center">
              {/* Drag Handle - Hide for deleted/archived chapters */}
              {!isPendingDeletion && !isArchived && (
                <div className="px-2 py-3 cursor-grab hover:bg-bg2 rounded-l-lg transition-colors">
                  <GripVertical className="w-4 h-4 text-text/40" />
                </div>
              )}

              {/* Chapter Content */}
              <button
                onClick={() => onChapterSelect(chapter)}
                className="flex-1 text-left p-3 rounded-r-lg"
              >
                <div className="flex items-center gap-3">
                  {(isPendingDeletion || (isArchived && hasScheduledDeletion)) && (
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  )}
                  {isArchived && !hasScheduledDeletion && (
                    <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  )}
                  <div className={`
                    w-6 h-6 rounded text-xs font-medium flex items-center justify-center flex-shrink-0
                    ${isPendingDeletion || (isArchived && hasScheduledDeletion)
                      ? 'bg-red-600 text-white' 
                      : isArchived
                        ? 'bg-yellow-600 text-white'
                        : isSelected 
                          ? 'bg-primary text-white' 
                          : 'bg-bg2 text-text'
                    }
                  `}>
                    {chapterData.chapterNumber}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-medium truncate ${
                      isPendingDeletion || (isArchived && hasScheduledDeletion)
                        ? 'text-red-600 line-through' 
                        : isArchived
                          ? 'text-yellow-600'
                          : isSelected 
                            ? 'text-primary' 
                            : 'text-heading'
                    }`}>
                      {chapterData.title || `Chapter ${chapterData.chapterNumber}`}
                    </div>
                    {isPendingDeletion && (
                      <div className="text-xs text-red-600 mt-0.5">
                        Will be deleted on save
                      </div>
                    )}
                    {isArchived && hasScheduledDeletion && (
                      <ChapterDeletionBadge
                        scheduledDeleteAt={chapterData.purgeAfterAt || chapterData.scheduledDeleteAt}
                        isPending={false}
                      />
                    )}
                    {isArchived && !hasScheduledDeletion && (
                      <div className="text-xs text-yellow-600 mt-0.5">
                        Archived
                      </div>
                    )}
                  </div>
                </div>
              </button>

              {/* Delete/Undo/Restore Action */}
              {isPendingDeletion ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onChapterUndoDelete(chapter);
                  }}
                  className="p-2 mr-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-opacity"
                  title="Cancel deletion"
                >
                  <RotateCcw className="w-4 h-4 text-green-600" />
                </button>
              ) : isArchived ? (
                hasScheduledDeletion ? (
                  // Show restore button for scheduled deletion
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRestoreArchived) onRestoreArchived(chapter);
                    }}
                    className="p-2 mr-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                    title="Restore chapter"
                  >
                    <RotateCcw className="w-4 h-4 text-green-600" />
                  </button>
                ) : (
                  // Just show archived state, no action
                  <div className="p-2 mr-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                )
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onChapterDelete(chapter);
                  }}
                  className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 dark:hover:bg-red-900/20 rounded mr-2"
                  title="Delete chapter"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              )}
            </div>

            {/* Drop Indicator Line */}
            {isDraggedOver && (
              <div className="absolute -bottom-1 left-0 right-0 h-1 bg-primary rounded-full animate-pulse" />
            )}
          </div>
        );
      })}
      
      {/* Drop zone indicator when dragging */}
      {isDragging && chapters.filter(ch => !ch.pendingDeletion && !(ch.chapters || ch).isArchived).length === 0 && (
        <div className="border-2 border-dashed border-primary/50 rounded-lg p-8 text-center">
          <p className="text-sm text-text/60">Drop chapter here</p>
        </div>
      )}
    </div>
  );
}