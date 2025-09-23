// frontend/src/hooks/useChapterChanges.js
import { useState, useCallback, useRef, useEffect } from 'react';

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
  
  // Keep track of the original state for comparison
  const originalState = useRef(null);

  // Initialize original state
  useEffect(() => {
    if (initialChapters.length > 0 && !originalState.current) {
      originalState.current = JSON.stringify(
        initialChapters.map(ch => {
          const data = ch.chapters || ch;
          return {
            chapterId: data.chapterId,
            chapterNumber: data.chapterNumber,
            title: data.title,
            description: data.description,
            content: data.content,
            imageId: data.imageId,
            videoId: data.videoId,
            isArchived: data.isArchived
          };
        }).sort((a, b) => a.chapterNumber - b.chapterNumber)
      );
    }
  }, [initialChapters]);

  function renumberChapters(chaptersList) {
    let chapterNumber = 1;
    return chaptersList.map(chapter => {
      const chapterData = chapter.chapters || chapter;
      
      if (chapter.pendingDeletion || chapterData.isArchived) {
        return chapter;
      }
      
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

  // Check if current state matches original state
  const checkIfOriginalStateRestored = useCallback((currentChapters) => {
    if (!originalState.current) return false;
    
    // Filter out temp chapters and deleted chapters
    const activeChapters = currentChapters.filter(ch => 
      !ch.isTemp && !ch.pendingDeletion
    );
    
    // Create a comparable state string
    const currentState = JSON.stringify(
      activeChapters.map(ch => {
        const data = ch.chapters || ch;
        return {
          chapterId: data.chapterId,
          chapterNumber: data.chapterNumber,
          title: data.title,
          description: data.description,
          content: data.content,
          imageId: data.imageId,
          videoId: data.videoId,
          isArchived: data.isArchived
        };
      }).sort((a, b) => a.chapterNumber - b.chapterNumber)
    );
    
    return currentState === originalState.current;
  }, []);

  const reset = useCallback((newChapters) => {
    const cleanChapters = newChapters.filter(ch => !ch.isTemp);
    const sorted = sortChaptersByNumber(cleanChapters);
    
    setChapters(sorted);
    originalChapters.current = cleanChapters;
    originalOrder.current = cleanChapters.map(c => (c.chapters || c).chapterId);
    
    // Store original state for comparison
    originalState.current = JSON.stringify(
      cleanChapters.map(ch => {
        const data = ch.chapters || ch;
        return {
          chapterId: data.chapterId,
          chapterNumber: data.chapterNumber,
          title: data.title,
          description: data.description,
          content: data.content,
          imageId: data.imageId,
          videoId: data.videoId,
          isArchived: data.isArchived
        };
      }).sort((a, b) => a.chapterNumber - b.chapterNumber)
    );
    
    setPendingChanges({
      added: [],
      modified: [],
      deleted: [],
      reordered: false
    });
  }, []);

  const addChapter = useCallback((chapterData) => {
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    
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
      
      if (chapter.pendingDeletion) return prev;
      
      const oldNumber = (chapter.chapters || chapter).chapterNumber;
      
      if (updates.chapterNumber !== undefined && updates.chapterNumber !== oldNumber) {
        const newNumber = updates.chapterNumber;
        
        const activeChapters = updatedChapters.filter(ch => 
          !ch.pendingDeletion && !(ch.chapters || ch).isArchived
        );
        const maxNumber = activeChapters.length;
        
        const targetNumber = Math.max(1, Math.min(newNumber, maxNumber + 1));
        
        const updatedChapter = {
          ...chapter,
          ...(chapter.chapters ? { 
            chapters: { ...(chapter.chapters || chapter), ...updates, chapterNumber: targetNumber } 
          } : { ...updates, chapterNumber: targetNumber })
        };
        
        updatedChapters[chapterIndex] = updatedChapter;
        
        updatedChapters = updatedChapters.map((ch, idx) => {
          if (idx === chapterIndex) return ch;
          
          const chData = ch.chapters || ch;
          if (ch.pendingDeletion || chData.isArchived) return ch;
          
          const currentNum = chData.chapterNumber;
          let newNum = currentNum;
          
          if (oldNumber < targetNumber) {
            if (currentNum > oldNumber && currentNum <= targetNumber) {
              newNum = currentNum - 1;
            }
          } else {
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
        
        updatedChapters = sortChaptersByNumber(updatedChapters);
      } else {
        // Regular update without number change
        const updatedChapter = {
          ...chapter,
          ...(chapter.chapters ? { 
            chapters: { ...(chapter.chapters || chapter), ...updates } 
          } : updates)
        };
        
        updatedChapters[chapterIndex] = updatedChapter;
      }
      
      // Check if we've restored the original state
      if (checkIfOriginalStateRestored(updatedChapters)) {
        setPendingChanges({
          added: [],
          modified: [],
          deleted: [],
          reordered: false
        });
      } else {
        // Update pending changes as before
        if (!chapter.isTemp) {
          setPendingChanges(current => {
            const existingModified = current.modified.filter(c => 
              (c.chapters || c).chapterId !== chapterId
            );
            
            // Check if this chapter has actually been modified from original
            const originalChapter = originalChapters.current.find(c => 
              (c.chapters || c).chapterId === chapterId
            );
            
            if (originalChapter) {
              const origData = originalChapter.chapters || originalChapter;
              const newData = updatedChapters[chapterIndex].chapters || updatedChapters[chapterIndex];
              
              // Check if there are actual changes
              const hasChanges = 
                origData.chapterNumber !== newData.chapterNumber ||
                origData.title !== newData.title ||
                origData.description !== newData.description ||
                origData.content !== newData.content ||
                origData.imageId !== newData.imageId ||
                origData.videoId !== newData.videoId;
              
              if (hasChanges) {
                return {
                  ...current,
                  modified: [...existingModified, updatedChapters[chapterIndex]]
                };
              } else {
                return {
                  ...current,
                  modified: existingModified
                };
              }
            }
            
            return current;
          });
        } else {
          setPendingChanges(current => ({
            ...current,
            added: current.added.map(c => 
              c.chapterId === chapterId ? updatedChapters[chapterIndex] : c
            )
          }));
        }
      }
      
      return updatedChapters;
    });
  }, [checkIfOriginalStateRestored, originalChapters]);

  const deleteChapter = useCallback((chapterId) => {
    setChapters(prev => {
      const chapterToDelete = prev.find(c => (c.chapters || c).chapterId === chapterId);
      
      if (!chapterToDelete) return prev;
      
      if (chapterToDelete?.isTemp) {
        const filtered = prev.filter(c => (c.chapters || c).chapterId !== chapterId);
        const renumbered = renumberChapters(filtered);
        
        setPendingChanges(current => ({
          ...current,
          added: current.added.filter(c => c.chapterId !== chapterId)
        }));
        
        return sortChaptersByNumber(renumbered);
      }
      
      const updatedChapters = prev.map(ch => {
        if ((ch.chapters || ch).chapterId === chapterId) {
          return { ...ch, pendingDeletion: true, deletedAt: Date.now() };
        }
        return ch;
      });
      
      setPendingChanges(current => {
        const modified = current.modified.filter(c => (c.chapters || c).chapterId !== chapterId);
        
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
      
      // Check if we've restored the original state
      if (checkIfOriginalStateRestored(updatedChapters)) {
        setPendingChanges({
          added: [],
          modified: [],
          deleted: [],
          reordered: false
        });
      } else {
        setPendingChanges(current => ({
          ...current,
          deleted: current.deleted.filter(c => (c.chapters || c).chapterId !== chapterId)
        }));
      }
      
      return updatedChapters;
    });
  }, [checkIfOriginalStateRestored]);

  const reorderChapters = useCallback((reorderedChapters) => {
    setChapters(sortChaptersByNumber(reorderedChapters));
    
    // Check if we've restored the original order
    if (checkIfOriginalStateRestored(reorderedChapters)) {
      // Clear all pending changes if we're back to original state
      setPendingChanges({
        added: [],
        modified: [],
        deleted: [],
        reordered: false
      });
    } else {
      // Mark as reordered and track modified chapters
      const modifiedChapters = reorderedChapters.filter(c => 
        !c.isTemp && !c.pendingDeletion && !(c.chapters || c).isArchived
      );
      
      setPendingChanges(prev => {
        const modifiedIds = new Set(prev.modified.map(c => (c.chapters || c).chapterId));
        const newModified = [...prev.modified];
        
        modifiedChapters.forEach(chapter => {
          const chapterId = (chapter.chapters || chapter).chapterId;
          const originalChapter = originalChapters.current.find(c => 
            (c.chapters || c).chapterId === chapterId
          );
          
          if (originalChapter) {
            const origData = originalChapter.chapters || originalChapter;
            const newData = chapter.chapters || chapter;
            
            // Check if this chapter has actually changed from original
            const hasChanges = 
              origData.chapterNumber !== newData.chapterNumber ||
              origData.title !== newData.title ||
              origData.description !== newData.description ||
              origData.content !== newData.content ||
              origData.imageId !== newData.imageId ||
              origData.videoId !== newData.videoId;
            
            if (hasChanges && !modifiedIds.has(chapterId)) {
              newModified.push(chapter);
            } else if (!hasChanges && modifiedIds.has(chapterId)) {
              // Remove from modified if it's back to original
              const index = newModified.findIndex(c => (c.chapters || c).chapterId === chapterId);
              if (index !== -1) {
                newModified.splice(index, 1);
              }
            }
          }
        });
        
        // Determine if order has changed
        const currentOrder = reorderedChapters
          .filter(c => !c.isTemp && !c.pendingDeletion && !(c.chapters || c).isArchived)
          .map(c => (c.chapters || c).chapterId);
        
        const isReordered = JSON.stringify(currentOrder) !== JSON.stringify(originalOrder.current);
        
        return {
          ...prev,
          modified: newModified,
          reordered: isReordered
        };
      });
    }
  }, [checkIfOriginalStateRestored, originalChapters]);

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