// frontend/src/hooks/useChapterChanges.js
import { useState, useCallback, useRef } from 'react';

export default function useChapterChanges(initialChapters = []) {
  const [chapters, setChapters] = useState(() => renumberChapters(initialChapters));
  const [pendingChanges, setPendingChanges] = useState({
    added: [],    // New chapters to create
    modified: [], // Existing chapters to update
    deleted: [],  // Chapters to delete
    reordered: false // Track if order changed
  });
  
  // Keep track of original chapters for comparison
  const originalChapters = useRef(initialChapters);
  const originalOrder = useRef(initialChapters.map(c => (c.chapters || c).chapterId));

  // Helper function to renumber chapters sequentially
  function renumberChapters(chaptersList) {
    return chaptersList.map((chapter, index) => {
      const newNumber = index + 1;
      const chapterData = chapter.chapters || chapter;
      
      if (chapter.chapters) {
        return {
          ...chapter,
          chapters: {
            ...chapterData,
            chapterNumber: newNumber
          }
        };
      } else {
        return {
          ...chapter,
          chapterNumber: newNumber
        };
      }
    });
  }

  // Reset to initial state
  const reset = useCallback((newChapters) => {
    const renumbered = renumberChapters(newChapters);
    setChapters(renumbered);
    originalChapters.current = newChapters;
    originalOrder.current = newChapters.map(c => (c.chapters || c).chapterId);
    setPendingChanges({
      added: [],
      modified: [],
      deleted: [],
      reordered: false
    });
  }, []);

  // Add a new chapter (locally only)
  const addChapter = useCallback((chapterData) => {
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    
    setChapters(prev => {
      const newChapter = {
        ...chapterData,
        chapterId: tempId,
        chapterNumber: prev.length + 1, // Always add at the end
        isTemp: true, // Flag to identify unsaved chapters
      };

      const updatedChapters = [...prev, newChapter];
      
      setPendingChanges(current => ({
        ...current,
        added: [...current.added, newChapter]
      }));

      return updatedChapters;
    });

    return {
      ...chapterData,
      chapterId: tempId,
      chapterNumber: chapters.length + 1,
      isTemp: true
    };
  }, [chapters.length]);

  // Update a chapter (locally only)
  const updateChapter = useCallback((chapterId, updates) => {
    setChapters(prev => prev.map(chapter => {
      const chapterData = chapter.chapters || chapter;
      if (chapterData.chapterId === chapterId) {
        // Don't allow manual chapter number updates through this method
        const { chapterNumber, ...safeUpdates } = updates;
        
        const updatedChapter = {
          ...chapter,
          ...(chapter.chapters ? { chapters: { ...chapterData, ...safeUpdates } } : safeUpdates)
        };
        
        // Track as modified if it's not a temp chapter
        if (!chapter.isTemp) {
          setPendingChanges(prev => ({
            ...prev,
            modified: [
              ...prev.modified.filter(c => (c.chapters || c).chapterId !== chapterId),
              updatedChapter
            ]
          }));
        } else {
          // Update in added array if it's a temp chapter
          setPendingChanges(prev => ({
            ...prev,
            added: prev.added.map(c => 
              c.chapterId === chapterId ? updatedChapter : c
            )
          }));
        }
        
        return updatedChapter;
      }
      return chapter;
    }));
  }, []);

  // Delete a chapter (mark for deletion if existing, remove if temp)
  const deleteChapter = useCallback((chapterId) => {
    setChapters(prev => {
      const chapterToDelete = prev.find(c => (c.chapters || c).chapterId === chapterId);
      const chapterIndex = prev.findIndex(c => (c.chapters || c).chapterId === chapterId);
      
      if (!chapterToDelete) return prev;
      
      // Remove the chapter
      const filtered = prev.filter(c => (c.chapters || c).chapterId !== chapterId);
      
      // Renumber remaining chapters
      const renumbered = renumberChapters(filtered);
      
      if (chapterToDelete?.isTemp) {
        // Remove temp chapter from added list
        setPendingChanges(current => ({
          ...current,
          added: current.added.filter(c => c.chapterId !== chapterId)
        }));
      } else {
        // Mark existing chapter for deletion
        setPendingChanges(current => ({
          ...current,
          deleted: [...current.deleted, chapterToDelete],
          modified: current.modified.filter(c => (c.chapters || c).chapterId !== chapterId)
        }));
      }
      
      // Mark all chapters after the deleted one as modified (due to renumbering)
      const chaptersToMarkModified = renumbered
        .slice(chapterIndex) // Get all chapters that were after the deleted one
        .filter(c => !c.isTemp); // Only existing chapters, not temp ones
      
      if (chaptersToMarkModified.length > 0) {
        setPendingChanges(current => {
          const modifiedIds = new Set(current.modified.map(c => (c.chapters || c).chapterId));
          const newModified = [...current.modified];
          
          chaptersToMarkModified.forEach(chapter => {
            const chapterId = (chapter.chapters || chapter).chapterId;
            if (!modifiedIds.has(chapterId)) {
              newModified.push(chapter);
            } else {
              // Update existing modified entry
              const index = newModified.findIndex(c => (c.chapters || c).chapterId === chapterId);
              if (index !== -1) {
                newModified[index] = chapter;
              }
            }
          });
          
          return {
            ...current,
            modified: newModified
          };
        });
      }
      
      return renumbered;
    });
  }, []);

  // Reorder chapters
  const reorderChapters = useCallback((reorderedChapters) => {
    // Renumber based on new order
    const renumbered = renumberChapters(reorderedChapters);
    setChapters(renumbered);
    
    // Check if order actually changed from original
    const newOrder = renumbered.map(c => (c.chapters || c).chapterId);
    const orderChanged = JSON.stringify(newOrder) !== JSON.stringify(originalOrder.current);
    
    // Mark all non-temp chapters as modified if order changed
    if (orderChanged) {
      const modifiedChapters = renumbered.filter(c => !c.isTemp);
      
      setPendingChanges(prev => {
        const modifiedIds = new Set(prev.modified.map(c => (c.chapters || c).chapterId));
        const newModified = [...prev.modified];
        
        modifiedChapters.forEach(chapter => {
          const chapterId = (chapter.chapters || chapter).chapterId;
          if (!modifiedIds.has(chapterId)) {
            newModified.push(chapter);
          } else {
            // Update existing modified entry
            const index = newModified.findIndex(c => (c.chapters || c).chapterId === chapterId);
            if (index !== -1) {
              newModified[index] = chapter;
            }
          }
        });
        
        return {
          ...prev,
          modified: newModified,
          reordered: true
        };
      });
    } else {
      setPendingChanges(prev => ({
        ...prev,
        reordered: false
      }));
    }
  }, []);

  // Check if there are any unsaved changes
  const hasChanges = useCallback(() => {
    return pendingChanges.added.length > 0 ||
           pendingChanges.modified.length > 0 ||
           pendingChanges.deleted.length > 0 ||
           pendingChanges.reordered;
  }, [pendingChanges]);

  // Get all changes for saving
  const getChanges = useCallback(() => {
    return {
      ...pendingChanges,
      currentOrder: chapters
    };
  }, [pendingChanges, chapters]);

  return {
    chapters,
    pendingChanges,
    addChapter,
    updateChapter,
    deleteChapter,
    reorderChapters,
    hasChanges,
    getChanges,
    reset
  };
}