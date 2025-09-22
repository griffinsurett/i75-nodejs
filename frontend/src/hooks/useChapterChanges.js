// frontend/src/hooks/useChapterChanges.js
import { useState, useCallback, useRef } from 'react';

export default function useChapterChanges(initialChapters = []) {
  const [chapters, setChapters] = useState(initialChapters);
  const [pendingChanges, setPendingChanges] = useState({
    added: [],    // New chapters to create
    modified: [], // Existing chapters to update
    deleted: [],  // Chapters to delete
    reordered: false // Track if order changed
  });
  
  // Keep track of original chapters for comparison
  const originalChapters = useRef(initialChapters);
  const originalOrder = useRef(initialChapters.map(c => (c.chapters || c).chapterId));

  // Reset to initial state
  const reset = useCallback((newChapters) => {
    setChapters(newChapters);
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
    const newChapter = {
      ...chapterData,
      chapterId: tempId,
      isTemp: true, // Flag to identify unsaved chapters
    };

    setChapters(prev => [...prev, newChapter]);
    setPendingChanges(prev => ({
      ...prev,
      added: [...prev.added, newChapter]
    }));

    return newChapter;
  }, []);

  // Update a chapter (locally only)
  const updateChapter = useCallback((chapterId, updates) => {
    setChapters(prev => prev.map(chapter => {
      const chapterData = chapter.chapters || chapter;
      if (chapterData.chapterId === chapterId) {
        const updatedChapter = {
          ...chapter,
          ...(chapter.chapters ? { chapters: { ...chapterData, ...updates } } : updates)
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
    const chapterToDelete = chapters.find(c => (c.chapters || c).chapterId === chapterId);
    
    if (chapterToDelete?.isTemp) {
      // Remove temp chapter immediately
      setChapters(prev => prev.filter(c => (c.chapters || c).chapterId !== chapterId));
      setPendingChanges(prev => ({
        ...prev,
        added: prev.added.filter(c => c.chapterId !== chapterId)
      }));
    } else {
      // Mark existing chapter for deletion
      setPendingChanges(prev => ({
        ...prev,
        deleted: [...prev.deleted, chapterToDelete],
        modified: prev.modified.filter(c => (c.chapters || c).chapterId !== chapterId)
      }));
      setChapters(prev => prev.filter(c => (c.chapters || c).chapterId !== chapterId));
    }
  }, [chapters]);

  // Reorder chapters
  const reorderChapters = useCallback((reorderedChapters) => {
    setChapters(reorderedChapters);
    
    // Check if order actually changed from original
    const newOrder = reorderedChapters.map(c => (c.chapters || c).chapterId);
    const orderChanged = JSON.stringify(newOrder) !== JSON.stringify(originalOrder.current);
    
    setPendingChanges(prev => ({
      ...prev,
      reordered: orderChanged
    }));
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