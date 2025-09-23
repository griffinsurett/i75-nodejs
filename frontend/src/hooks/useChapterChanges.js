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
    // Only renumber non-deleted, non-archived chapters
    // Keep deleted and archived chapters in their original positions
    let chapterNumber = 1;
    return chaptersList.map(chapter => {
      const chapterData = chapter.chapters || chapter;
      
      // Keep original number for deleted or archived chapters
      if (chapter.pendingDeletion || chapterData.isArchived) {
        return chapter;
      }
      
      // Assign new number for active chapters
      const newNumber = chapterNumber++;
      
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
    // Don't renumber on reset - keep original numbers
    const sorted = sortChaptersByNumber(cleanChapters);
    
    setChapters(sorted);
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
    
    // Calculate next chapter number based on all chapters (including deleted/archived)
    const maxNumber = chapters.reduce((max, ch) => {
      const num = (ch.chapters || ch).chapterNumber || 0;
      return Math.max(max, num);
    }, 0);
    
    const newChapter = {
      ...chapterData,
      chapterId: tempId,
      chapterNumber: chapterData.chapterNumber || maxNumber + 1,
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
      return sortChaptersByNumber(updatedChapters);
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
      
      // If chapter number is being changed, handle reordering
      if (updates.chapterNumber !== undefined && updates.chapterNumber !== oldNumber) {
        const newNumber = updates.chapterNumber;
        
        // Count only active chapters for max number validation
        const activeChapters = updatedChapters.filter(ch => 
          !ch.pendingDeletion && !(ch.chapters || ch).isArchived
        );
        const maxNumber = activeChapters.length;
        
        // Clamp the new number to valid range
        const targetNumber = Math.max(1, Math.min(newNumber, maxNumber + 1));
        
        // Update the chapter with new number
        const updatedChapter = {
          ...chapter,
          ...(chapter.chapters ? { 
            chapters: { ...(chapter.chapters || chapter), ...updates, chapterNumber: targetNumber } 
          } : { ...updates, chapterNumber: targetNumber })
        };
        
        updatedChapters[chapterIndex] = updatedChapter;
        
        // Adjust other active chapters' numbers if needed
        updatedChapters = updatedChapters.map((ch, idx) => {
          if (idx === chapterIndex) return ch;
          
          const chData = ch.chapters || ch;
          // Skip deleted and archived chapters
          if (ch.pendingDeletion || chData.isArchived) return ch;
          
          const currentNum = chData.chapterNumber;
          let newNum = currentNum;
          
          if (oldNumber < targetNumber) {
            // Moving down: shift chapters in between up
            if (currentNum > oldNumber && currentNum <= targetNumber) {
              newNum = currentNum - 1;
            }
          } else {
            // Moving up: shift chapters in between down
            if (currentNum >= targetNumber && currentNum < oldNumber) {
              newNum = currentNum + 1;
            }
          }
          
          if (newNum !== currentNum) {
            if (ch.chapters) {
              return {
                ...ch,
                chapters: { ...chData, chapterNumber: newNum }
              };
            } else {
              return { ...ch, chapterNumber: newNum };
            }
          }
          
          return ch;
        });
        
        // Re-sort by chapter number
        updatedChapters = sortChaptersByNumber(updatedChapters);
        
        // Mark affected chapters as modified
        const modifiedChapters = updatedChapters.filter(c => 
          !c.isTemp && !c.pendingDeletion && !(c.chapters || c).isArchived
        );
        
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
      
      // If it's a temp chapter, remove it immediately and renumber
      if (chapterToDelete?.isTemp) {
        const filtered = prev.filter(c => (c.chapters || c).chapterId !== chapterId);
        const renumbered = renumberChapters(filtered);
        
        setPendingChanges(current => ({
          ...current,
          added: current.added.filter(c => c.chapterId !== chapterId)
        }));
        
        return sortChaptersByNumber(renumbered);
      }
      
      // For existing chapters, mark as pending deletion but keep in place
      const updatedChapters = prev.map(ch => {
        if ((ch.chapters || ch).chapterId === chapterId) {
          return { ...ch, pendingDeletion: true, deletedAt: Date.now() };
        }
        return ch;
      });
      
      // Don't renumber - keep original positions
      
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
      
      return updatedChapters;
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
      
      // Update pending changes
      setPendingChanges(current => ({
        ...current,
        deleted: current.deleted.filter(c => (c.chapters || c).chapterId !== chapterId)
      }));
      
      return updatedChapters;
    });
  }, []);

  const reorderChapters = useCallback((reorderedChapters) => {
    // Keep all chapters in their new positions
    setChapters(sortChaptersByNumber(reorderedChapters));
    
    // Mark non-temp, non-deleted, non-archived chapters as modified
    const modifiedChapters = reorderedChapters.filter(c => 
      !c.isTemp && !c.pendingDeletion && !(c.chapters || c).isArchived
    );
    
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
      currentOrder: chapters.filter(ch => !ch.pendingDeletion && !(ch.chapters || ch).isArchived)
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