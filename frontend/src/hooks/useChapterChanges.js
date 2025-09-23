// frontend/src/hooks/useChapterChanges.js
import { useState, useCallback, useRef } from 'react';

export default function useChapterChanges(initialChapters = []) {
  const [chapters, setChapters] = useState(() => renumberChapters(initialChapters));
  const [pendingChanges, setPendingChanges] = useState({
    added: [],
    modified: [],
    deleted: [],
    reordered: false
  });
  
  const originalChapters = useRef(initialChapters);
  const originalOrder = useRef(initialChapters.map(c => (c.chapters || c).chapterId));

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

  function sortChaptersByNumber(chaptersList) {
    return [...chaptersList].sort((a, b) => {
      const aNum = (a.chapters || a).chapterNumber || 0;
      const bNum = (b.chapters || b).chapterNumber || 0;
      return aNum - bNum;
    });
  }

  const reset = useCallback((newChapters) => {
    const cleanChapters = newChapters.filter(ch => !ch.isTemp);
    const renumbered = renumberChapters(cleanChapters);
    
    setChapters(renumbered);
    originalChapters.current = cleanChapters;
    originalOrder.current = cleanChapters.map(c => (c.chapters || c).chapterId);
    
    setPendingChanges({
      added: [],
      modified: [],
      deleted: [],
      reordered: false
    });
  }, []);

  const addChapter = useCallback((chapterData) => {
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    
    const newChapter = {
      ...chapterData,
      chapterId: tempId,
      chapterNumber: chapters.length + 1,
      isTemp: true,
    };

    setChapters(prev => {
      const exists = prev.some(ch => {
        const chData = ch.chapters || ch;
        return chData.title === newChapter.title && 
               chData.chapterNumber === newChapter.chapterNumber &&
               !ch.isTemp;
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

  // NEW: Smart update that handles reordering when chapter number changes
  const updateChapter = useCallback((chapterId, updates) => {
    setChapters(prev => {
      let updatedChapters = [...prev];
      const chapterIndex = updatedChapters.findIndex(ch => 
        (ch.chapters || ch).chapterId === chapterId
      );
      
      if (chapterIndex === -1) return prev;
      
      const chapter = updatedChapters[chapterIndex];
      const oldNumber = (chapter.chapters || chapter).chapterNumber;
      
      // If chapter number is being changed, handle smart reordering
      if (updates.chapterNumber !== undefined && updates.chapterNumber !== oldNumber) {
        const newNumber = updates.chapterNumber;
        const maxNumber = updatedChapters.length;
        
        // Clamp the new number to valid range
        const targetNumber = Math.max(1, Math.min(newNumber, maxNumber));
        
        // Remove the chapter from its current position
        const [movingChapter] = updatedChapters.splice(chapterIndex, 1);
        
        // Update the moving chapter with new data
        const updatedMovingChapter = {
          ...movingChapter,
          ...(movingChapter.chapters ? {
            chapters: { ...(movingChapter.chapters || movingChapter), ...updates }
          } : updates)
        };
        
        // Insert at new position (targetNumber - 1 for 0-based index)
        updatedChapters.splice(targetNumber - 1, 0, updatedMovingChapter);
        
        // Renumber all chapters
        updatedChapters = renumberChapters(updatedChapters);
        
        // Mark all non-temp chapters as modified
        const modifiedChapters = updatedChapters.filter(c => !c.isTemp);
        
        setPendingChanges(current => {
          const modifiedIds = new Set(current.modified.map(c => (c.chapters || c).chapterId));
          const newModified = [...current.modified];
          
          modifiedChapters.forEach(chapter => {
            const chapId = (chapter.chapters || chapter).chapterId;
            if (!modifiedIds.has(chapId)) {
              newModified.push(chapter);
            } else {
              const index = newModified.findIndex(c => (c.chapters || c).chapterId === chapId);
              if (index !== -1) {
                newModified[index] = chapter;
              }
            }
          });
          
          // Update temp chapters in added array
          const updatedAdded = current.added.map(addedCh => {
            const updated = updatedChapters.find(ch => 
              (ch.chapters || ch).chapterId === addedCh.chapterId
            );
            return updated || addedCh;
          });
          
          return {
            ...current,
            modified: newModified,
            added: updatedAdded,
            reordered: true
          };
        });
        
        return updatedChapters;
      }
      
      // Regular update without number change
      const updatedChapter = {
        ...chapter,
        ...(chapter.chapters ? { 
          chapters: { ...(chapter.chapters || chapter), ...updates } 
        } : updates)
      };
      
      updatedChapters[chapterIndex] = updatedChapter;
      
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
      
      return updatedChapters;
    });
  }, []);

  const deleteChapter = useCallback((chapterId) => {
    setChapters(prev => {
      const chapterToDelete = prev.find(c => (c.chapters || c).chapterId === chapterId);
      const chapterIndex = prev.findIndex(c => (c.chapters || c).chapterId === chapterId);
      
      if (!chapterToDelete) return prev;
      
      const filtered = prev.filter(c => (c.chapters || c).chapterId !== chapterId);
      const renumbered = renumberChapters(filtered);
      
      if (chapterToDelete?.isTemp) {
        setPendingChanges(current => ({
          ...current,
          added: current.added.filter(c => c.chapterId !== chapterId)
        }));
      } else {
        setPendingChanges(current => ({
          ...current,
          deleted: [...current.deleted, chapterToDelete],
          modified: current.modified.filter(c => (c.chapters || c).chapterId !== chapterId)
        }));
      }
      
      const chaptersToMarkModified = renumbered
        .slice(chapterIndex)
        .filter(c => !c.isTemp);
      
      if (chaptersToMarkModified.length > 0) {
        setPendingChanges(current => {
          const modifiedIds = new Set(current.modified.map(c => (c.chapters || c).chapterId));
          const newModified = [...current.modified];
          
          chaptersToMarkModified.forEach(chapter => {
            const chapterId = (chapter.chapters || chapter).chapterId;
            if (!modifiedIds.has(chapterId)) {
              newModified.push(chapter);
            } else {
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

  const reorderChapters = useCallback((reorderedChapters) => {
    const renumbered = renumberChapters(reorderedChapters);
    setChapters(renumbered);
    
    const modifiedChapters = renumbered.filter(c => !c.isTemp);
    
    setPendingChanges(prev => {
      const modifiedIds = new Set(prev.modified.map(c => (c.chapters || c).chapterId));
      const newModified = [...prev.modified];
      
      modifiedChapters.forEach(chapter => {
        const chapterId = (chapter.chapters || chapter).chapterId;
        if (!modifiedIds.has(chapterId)) {
          newModified.push(chapter);
        } else {
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

  const hasChanges = useCallback(() => {
    return pendingChanges.added.length > 0 ||
           pendingChanges.modified.length > 0 ||
           pendingChanges.deleted.length > 0 ||
           pendingChanges.reordered;
  }, [pendingChanges]);

  const getChanges = useCallback(() => {
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