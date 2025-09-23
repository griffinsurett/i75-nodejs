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
    // Only renumber non-deleted chapters
    const activeChapters = chaptersList.filter(ch => !ch.pendingDeletion);
    const deletedChapters = chaptersList.filter(ch => ch.pendingDeletion);
    
    const renumberedActive = activeChapters.map((chapter, index) => {
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
    
    // Keep deleted chapters with their original numbers
    return [...renumberedActive, ...deletedChapters];
  }

  function sortChaptersByNumber(chaptersList) {
    return [...chaptersList].sort((a, b) => {
      // Put deleted chapters at the end
      if (a.pendingDeletion && !b.pendingDeletion) return 1;
      if (!a.pendingDeletion && b.pendingDeletion) return -1;
      
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
      chapterNumber: chapters.filter(ch => !ch.pendingDeletion).length + 1,
      isTemp: true,
    };

    setChapters(prev => {
      const exists = prev.some(ch => {
        const chData = ch.chapters || ch;
        return chData.title === newChapter.title && 
               chData.chapterNumber === newChapter.chapterNumber &&
               !ch.isTemp &&
               !ch.pendingDeletion;
      });
      
      if (exists) {
        console.warn('Chapter already exists, skipping addition');
        return prev;
      }
      
      const updatedChapters = [...prev, newChapter];
      return renumberChapters(updatedChapters);
    });
    
    setPendingChanges(current => ({
      ...current,
      added: [...current.added, newChapter]
    }));

    return newChapter;
  }, [chapters]);

  const updateChapter = useCallback((chapterId, updates) => {
    setChapters(prev => {
      let updatedChapters = [...prev];
      const chapterIndex = updatedChapters.findIndex(ch => 
        (ch.chapters || ch).chapterId === chapterId
      );
      
      if (chapterIndex === -1) return prev;
      
      const chapter = updatedChapters[chapterIndex];
      
      // Don't allow updates to deleted chapters
      if (chapter.pendingDeletion) return prev;
      
      const oldNumber = (chapter.chapters || chapter).chapterNumber;
      
      // If chapter number is being changed, handle smart reordering
      if (updates.chapterNumber !== undefined && updates.chapterNumber !== oldNumber) {
        const newNumber = updates.chapterNumber;
        const activeChapters = updatedChapters.filter(ch => !ch.pendingDeletion);
        const maxNumber = activeChapters.length;
        
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
        const modifiedChapters = updatedChapters.filter(c => !c.isTemp && !c.pendingDeletion);
        
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
      
      if (!chapterToDelete) return prev;
      
      // If it's a temp chapter, remove it immediately
      if (chapterToDelete?.isTemp) {
        const filtered = prev.filter(c => (c.chapters || c).chapterId !== chapterId);
        const renumbered = renumberChapters(filtered);
        
        setPendingChanges(current => ({
          ...current,
          added: current.added.filter(c => c.chapterId !== chapterId)
        }));
        
        return renumbered;
      }
      
      // For existing chapters, mark as pending deletion
      const updatedChapters = prev.map(ch => {
        if ((ch.chapters || ch).chapterId === chapterId) {
          return { ...ch, pendingDeletion: true, deletedAt: Date.now() };
        }
        return ch;
      });
      
      // Renumber remaining active chapters
      const renumbered = renumberChapters(updatedChapters);
      
      // Track in deleted array
      setPendingChanges(current => {
        // Remove from modified if it was there
        const modified = current.modified.filter(c => (c.chapters || c).chapterId !== chapterId);
        
        // Add to deleted if not already there
        const alreadyDeleted = current.deleted.some(c => (c.chapters || c).chapterId === chapterId);
        const deleted = alreadyDeleted 
          ? current.deleted 
          : [...current.deleted, chapterToDelete];
        
        return {
          ...current,
          modified,
          deleted
        };
      });
      
      // Mark renumbered chapters as modified
      const chaptersToMarkModified = renumbered
        .filter(c => !c.isTemp && !c.pendingDeletion)
        .filter((ch, index) => {
          const originalIndex = prev.findIndex(
            original => (original.chapters || original).chapterId === (ch.chapters || ch).chapterId
          );
          return originalIndex !== index;
        });
      
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

  const undoDeleteChapter = useCallback((chapterId) => {
    setChapters(prev => {
      const updatedChapters = prev.map(ch => {
        if ((ch.chapters || ch).chapterId === chapterId) {
          const { pendingDeletion, deletedAt, ...cleanChapter } = ch;
          return cleanChapter;
        }
        return ch;
      });
      
      // Renumber chapters
      const renumbered = renumberChapters(updatedChapters);
      
      // Update pending changes
      setPendingChanges(current => ({
        ...current,
        deleted: current.deleted.filter(c => (c.chapters || c).chapterId !== chapterId)
      }));
      
      return renumbered;
    });
  }, []);

  const reorderChapters = useCallback((reorderedChapters) => {
    // Filter out deleted chapters for reordering
    const activeChapters = reorderedChapters.filter(ch => !ch.pendingDeletion);
    const deletedChapters = chapters.filter(ch => ch.pendingDeletion);
    
    const renumbered = renumberChapters([...activeChapters, ...deletedChapters]);
    setChapters(renumbered);
    
    const modifiedChapters = renumbered.filter(c => !c.isTemp && !c.pendingDeletion);
    
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
  }, [chapters]);

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
      currentOrder: chapters.filter(ch => !ch.pendingDeletion)
    };
  }, [pendingChanges, chapters]);

  return {
    chapters,
    pendingChanges,
    addChapter,
    updateChapter,
    deleteChapter,
    undoDeleteChapter,
    reorderChapters,
    hasChanges,
    getChanges,
    reset
  };
}