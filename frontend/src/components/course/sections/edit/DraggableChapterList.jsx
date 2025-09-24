// frontend/src/components/course/sections/edit/DraggableChapterList.jsx
import { useState, useRef } from 'react';
import { GripVertical, Trash2, RotateCcw, AlertTriangle, Clock } from 'lucide-react';
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
  const [dropPosition, setDropPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  // Sort chapters by chapter number
  const sortedChapters = [...chapters].sort((a, b) => {
    const aNum = (a.chapters || a).chapterNumber || 0;
    const bNum = (b.chapters || b).chapterNumber || 0;
    return aNum - bNum;
  });

  // Get only the active (draggable) chapters for reordering
  const activeChapters = sortedChapters.filter(ch => 
    !ch.pendingDeletion && !(ch.chapters || ch).isArchived
  );

  const handleDragStart = (e, chapter, indexInSorted) => {
    const chapterData = chapter.chapters || chapter;
    // Don't allow dragging deleted or archived chapters
    if (chapter.pendingDeletion || chapterData.isArchived) {
      e.preventDefault();
      return;
    }
    
    // Find the index in active chapters only
    const activeIndex = activeChapters.findIndex(ch => 
      (ch.chapters || ch).chapterId === chapterData.chapterId
    );
    
    setDraggedItem({ 
      chapter, 
      activeIndex,
      sortedIndex: indexInSorted 
    });
    setIsDragging(true);
    
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!containerRef.current || !isDragging) return;
    
    // Get all chapter items
    const items = [...containerRef.current.querySelectorAll('[data-chapter-item]')];
    
    // Find the closest item based on mouse position
    let closestItem = null;
    let closestOffset = Number.NEGATIVE_INFINITY;
    let closestIndex = -1;
    
    items.forEach((item, index) => {
      const box = item.getBoundingClientRect();
      const offset = e.clientY - box.top - box.height / 2;
      
      if (offset < 0 && offset > closestOffset) {
        closestOffset = offset;
        closestItem = item;
        closestIndex = index;
      }
    });
    
    if (closestItem) {
      // Found an item to insert before
      const targetChapter = sortedChapters[closestIndex];
      if (targetChapter && !targetChapter.pendingDeletion && !(targetChapter.chapters || targetChapter).isArchived) {
        setDropPosition({ 
          sortedIndex: closestIndex, 
          position: 'before' 
        });
      }
    } else {
      // Dropping at the end
      setDropPosition({ 
        sortedIndex: sortedChapters.length, 
        position: 'after' 
      });
    }
  };

  const handleDragLeave = (e) => {
    // Only clear drop position if we're leaving the container entirely
    if (e.currentTarget === containerRef.current && !e.currentTarget.contains(e.relatedTarget)) {
      setDropPosition(null);
    }
  };

const handleDrop = (e) => {
  e.preventDefault();
  
  if (!draggedItem || !dropPosition) {
    resetDragState();
    return;
  }
  
  // Work with active chapters only for reordering
  const fromIndex = draggedItem.activeIndex;
  
  // Calculate the target index in active chapters
  let targetActiveIndex = 0;
  if (dropPosition.position === 'before') {
    // Count how many active chapters come before the drop position
    for (let i = 0; i < dropPosition.sortedIndex; i++) {
      const ch = sortedChapters[i];
      if (!ch.pendingDeletion && !(ch.chapters || ch).isArchived) {
        targetActiveIndex++;
      }
    }
  } else {
    // Dropping at the end means after all active chapters
    targetActiveIndex = activeChapters.length;
  }
  
  // Adjust target index if needed
  if (fromIndex < targetActiveIndex) {
    targetActiveIndex = Math.max(0, targetActiveIndex - 1);
  }
  
  if (fromIndex !== targetActiveIndex) {
    // Create new array with reordered chapters
    const newActiveChapters = [...activeChapters];
    const [movedChapter] = newActiveChapters.splice(fromIndex, 1);
    newActiveChapters.splice(targetActiveIndex, 0, movedChapter);
    
    // Renumber the active chapters
    const renumbered = newActiveChapters.map((ch, idx) => ({
      ...ch,
      ...(ch.chapters ? {
        chapters: { ...ch.chapters, chapterNumber: idx + 1 }
      } : {
        chapterNumber: idx + 1
      })
    }));
    
    // Combine with non-active chapters (keep their original data)
    const nonActiveChapters = chapters.filter(ch => 
      ch.pendingDeletion || (ch.chapters || ch).isArchived
    );
    
    // Merge back all chapters
    const allChapters = [...renumbered, ...nonActiveChapters];
    
    // Call the reorder handler with the complete list
    onReorderChapters(allChapters);
    
    // SELECT THE DRAGGED CHAPTER AFTER REORDERING
    // Find the moved chapter in the new list and select it
    const movedChapterInNewList = renumbered[targetActiveIndex];
    if (movedChapterInNewList) {
      onChapterSelect(movedChapterInNewList);
    }
  }
  
  resetDragState();
};

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('opacity-50');
    resetDragState();
  };

  const resetDragState = () => {
    setDraggedItem(null);
    setDropPosition(null);
    setIsDragging(false);
  };

  const selectedChapterId = selectedChapter ? (selectedChapter.chapters || selectedChapter).chapterId : null;

  // Calculate where to show the drop indicator line
  const getDropLinePosition = (index) => {
    if (!dropPosition) return false;
    
    if (dropPosition.position === 'before' && dropPosition.sortedIndex === index) {
      return 'top';
    }
    if (dropPosition.position === 'after' && dropPosition.sortedIndex === index + 1) {
      return 'bottom';
    }
    return false;
  };

  return (
    <div 
      ref={containerRef}
      className="space-y-1 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {sortedChapters.map((chapter, index) => {
        const chapterData = chapter.chapters || chapter;
        const isSelected = chapterData.chapterId === selectedChapterId;
        const isBeingDragged = draggedItem?.sortedIndex === index;
        const isPendingDeletion = chapter.pendingDeletion;
        const isArchived = chapterData.isArchived;
        const hasScheduledDeletion = chapterData.purgeAfterAt || chapterData.scheduledDeleteAt;
        const dropLinePosition = getDropLinePosition(index);
        
        return (
          <div
            key={chapterData.chapterId}
            data-chapter-item
            className="relative"
          >
            {/* Drop indicator line - TOP */}
            {dropLinePosition === 'top' && (
              <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-primary rounded-full z-50 pointer-events-none">
                <div className="absolute -left-1 -top-1.5 w-1 h-4 bg-primary rounded-full" />
                <div className="absolute -right-1 -top-1.5 w-1 h-4 bg-primary rounded-full" />
              </div>
            )}
            
            <div
              draggable={!loading && !isPendingDeletion && !isArchived}
              onDragStart={(e) => handleDragStart(e, chapter, index)}
              onDragEnd={handleDragEnd}
              className={`
                group relative rounded-lg border transition-all 
                ${isPendingDeletion || isArchived ? 'cursor-not-allowed' : 'cursor-move'}
                ${isBeingDragged ? 'opacity-50' : ''}
                ${isSelected
                  ? isPendingDeletion || (isArchived && hasScheduledDeletion)
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                    : isArchived
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                      : 'bg-primary/10 border-primary/20 text-primary'
                  : isPendingDeletion || (isArchived && hasScheduledDeletion)
                    ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800 opacity-75'
                    : isArchived
                      ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800 opacity-75'
                      : 'border-transparent hover:bg-bg2 hover:border-border-primary'
                }
              `}
            >
              <div className="flex items-center">
                {/* Drag Handle - Hide for deleted/archived chapters */}
                {!isPendingDeletion && !isArchived && (
                  <div className="px-2 py-3 cursor-grab active:cursor-grabbing hover:bg-bg2 rounded-l-lg transition-colors">
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
            </div>

            {/* Drop indicator line - BOTTOM */}
            {dropLinePosition === 'bottom' && (
              <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary rounded-full z-50 pointer-events-none">
                <div className="absolute -left-1 -bottom-1.5 w-1 h-4 bg-primary rounded-full" />
                <div className="absolute -right-1 -bottom-1.5 w-1 h-4 bg-primary rounded-full" />
              </div>
            )}
          </div>
        );
      })}
      
      {/* Drop zone at the end when dragging */}
      {isDragging && activeChapters.length > 0 && dropPosition?.sortedIndex === sortedChapters.length && (
        <div className="relative">
          <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-primary rounded-full z-50 pointer-events-none">
            <div className="absolute -left-1 -top-1.5 w-1 h-4 bg-primary rounded-full" />
            <div className="absolute -right-1 -top-1.5 w-1 h-4 bg-primary rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
}