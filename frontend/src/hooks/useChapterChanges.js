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

  // Sort chapters by number
  function sortChaptersByNumber(chaptersList) {
    return [...chaptersList].sort((a, b) => {
      const aNum = (a.chapters || a).chapterNumber || 0;
      const bNum = (b.chapters || b).chapterNumber || 0;
      return aNum - bNum;
    });
  }

  // Reset to initial state - IMPORTANT: This clears ALL state including temp chapters
  const reset = useCallback((newChapters) => {
    // Filter out any temp chapters from the new chapters to prevent duplicates
    const cleanChapters = newChapters.filter(ch => !ch.isTemp);
    const renumbered = renumberChapters(cleanChapters);
    
    setChapters(renumbered);
    originalChapters.current = cleanChapters;
    originalOrder.current = cleanChapters.map(c => (c.chapters || c).chapterId);
    
    // Clear ALL pending changes
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
    
    const newChapter = {
      ...chapterData,
      chapterId: tempId,
      chapterNumber: chapters.length + 1,
      isTemp: true, // Flag to identify unsaved chapters
    };

    setChapters(prev => {
      // Check if a chapter with the same title and number already exists
      const exists = prev.some(ch => {
        const chData = ch.chapters || ch;
        return chData.title === newChapter.title && 
               chData.chapterNumber === newChapter.chapterNumber &&
               !ch.isTemp; // Only check against non-temp chapters
      });
      
      if (exists) {
        console.warn('Chapter already exists, skipping addition');
        return prev;
      }
      
      const updatedChapters = [...prev, newChapter];
      return updatedChapters;
    });
    
    setPendingChanges(current => ({
      ...current,
      added: [...current.added, newChapter]
    }));

    return newChapter;
  }, [chapters.length]);

  // Update a chapter (locally only) - INCLUDING chapter number changes
  const updateChapter = useCallback((chapterId, updates) => {
    setChapters(prev => {
      const updatedChapters = prev.map(chapter => {
        const chapterData = chapter.chapters || chapter;
        if (chapterData.chapterId === chapterId) {
          const updatedChapter = {
            ...chapter,
            ...(chapter.chapters ? { 
              chapters: { ...chapterData, ...updates } 
            } : updates)
          };
          
          // Track as modified if it's not a temp chapter
          if (!chapter.isTemp) {
            setPendingChanges(current => ({
              ...current,
              modified: [
                ...current.modified.filter(c => (c.chapters || c).chapterId !== chapterId),
                updatedChapter
              ]
            }));
          } else {
            // Update in added array if it's a temp chapter
            setPendingChanges(current => ({
              ...current,
              added: current.added.map(c => 
                c.chapterId === chapterId ? updatedChapter : c
              )
            }));
          }
          
          return updatedChapter;
        }
        return chapter;
      });
      
      // If chapter number was updated, re-sort the chapters
      if (updates.chapterNumber !== undefined) {
        return sortChaptersByNumber(updatedChapters);
      }
      
      return updatedChapters;
    });
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

  // Reorder chapters (for drag and drop)
  const reorderChapters = useCallback((reorderedChapters) => {
    // Renumber based on new order
    const renumbered = renumberChapters(reorderedChapters);
    setChapters(renumbered);
    
    // Mark all non-temp chapters as modified since their numbers changed
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
  }, []);

  // Check if there are any unsaved changes
  const hasChanges = useCallback(() => {
    return pendingChanges.added.length > 0 ||
           pendingChanges.modified.length > 0 ||
           pendingChanges.deleted.length > 0 ||
           pendingChanges.reordered;
  }, [pendingChanges]);

  // Get all changes for saving - filtering out duplicates
  const getChanges = useCallback(() => {
    // Filter out any duplicate temp chapters before returning
    const uniqueAdded = pendingChanges.added.filter((chapter, index, self) => 
      index === self.findIndex(ch => 
        ch.title === chapter.title && ch.chapterNumber === chapter.chapterNumber
      )
    );
    
    return {
      ...pendingChanges,
      added: uniqueAdded,
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