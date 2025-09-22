// frontend/src/components/course/sections/edit/DraggableChapterList.jsx
import { useState, useRef } from 'react';
import { GripVertical, Trash2 } from 'lucide-react';
import { reorderChapters } from '../../../../utils/chapterUtils';

export default function DraggableChapterList({
  chapters,
  selectedChapter,
  onChapterSelect,
  onChapterDelete,
  onReorderChapters,
  loading = false,
}) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverItem, setDraggedOverItem] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragStart = (e, index, chapter) => {
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

  // Sort chapters by number before rendering
  const sortedChapters = [...chapters].sort((a, b) => {
    const aNum = (a.chapters || a).chapterNumber || 0;
    const bNum = (b.chapters || b).chapterNumber || 0;
    return aNum - bNum;
  });

  return (
    <div className="space-y-1">
      {sortedChapters.map((chapter, index) => {
        const chapterData = chapter.chapters || chapter;
        const isSelected = chapterData.chapterId === selectedChapterId;
        const isDraggedOver = draggedOverItem === index;
        const isBeingDragged = draggedItem?.index === index;
        
        return (
          <div
            key={chapterData.chapterId}
            draggable={!loading}
            onDragStart={(e) => handleDragStart(e, index, chapter)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              group relative rounded-lg border transition-all cursor-move
              ${isBeingDragged ? 'opacity-50 scale-95' : ''}
              ${isDraggedOver ? 'border-primary border-2 bg-primary/5' : ''}
              ${isSelected && !isDraggedOver
                ? 'bg-primary/10 border-primary/20 text-primary'
                : !isDraggedOver && 'border-transparent hover:bg-bg2 hover:border-border-primary'
              }
              ${isDragging && !isBeingDragged ? 'transition-transform' : ''}
            `}
            style={{
              transform: isDraggedOver && !isBeingDragged ? 'translateY(2px)' : '',
            }}
          >
            <div className="flex items-center">
              {/* Drag Handle */}
              <div className="px-2 py-3 cursor-grab hover:bg-bg2 rounded-l-lg transition-colors">
                <GripVertical className="w-4 h-4 text-text/40" />
              </div>

              {/* Chapter Content */}
              <button
                onClick={() => onChapterSelect(chapter)}
                className="flex-1 text-left p-3 rounded-r-lg"
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-6 h-6 rounded text-xs font-medium flex items-center justify-center flex-shrink-0
                    ${isSelected ? 'bg-primary text-white' : 'bg-bg2 text-text'}
                  `}>
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

              {/* Delete Action */}
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
            </div>

            {/* Drop Indicator Line */}
            {isDraggedOver && (
              <div className="absolute -bottom-1 left-0 right-0 h-1 bg-primary rounded-full animate-pulse" />
            )}
          </div>
        );
      })}
      
      {/* Drop zone indicator when dragging */}
      {isDragging && chapters.length === 0 && (
        <div className="border-2 border-dashed border-primary/50 rounded-lg p-8 text-center">
          <p className="text-sm text-text/60">Drop chapter here</p>
        </div>
      )}
    </div>
  );
}