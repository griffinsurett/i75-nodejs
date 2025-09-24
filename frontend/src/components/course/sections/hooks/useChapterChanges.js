// useChapterChanges.js
import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Dynamic change tracking hook that automatically tracks all fields
 * @param {Array} initialChapters - Initial chapters data
 * @param {Object} options - Configuration options
 */
export default function useChapterChanges(initialChapters = [], options = {}) {
  const {
    normalize = (value) => {
      if (value === null || value === undefined || value === '') {
        return '';
      }
      return typeof value === 'string' ? value.trim() : value;
    },
    identifierField = 'chapterId',
    numberField = 'chapterNumber',
    dataWrapper = 'chapters', // Some items come wrapped in { chapters: {...} }
    excludeFields = ['createdAt', 'updatedAt', 'deletedAt'], // Fields to exclude from change tracking
  } = options;

  const [chapters, setChapters] = useState(() => renumberChapters(initialChapters));
  const [pendingChanges, setPendingChanges] = useState({
    added: [],
    modified: [],
    deleted: [],
    reordered: false
  });
  
  const originalChapters = useRef(initialChapters);
  const originalOrder = useRef(initialChapters.map(c => 
    (c[dataWrapper] || c)[identifierField]
  ));
  const originalState = useRef(null);
  const trackedFields = useRef(new Set());

  // Helper to extract data from wrapped or unwrapped chapter
  const getData = (chapter) => chapter[dataWrapper] || chapter;

  // Detect all fields from the data
  const detectFields = useCallback((chapters) => {
    const fields = new Set();
    
    chapters.forEach(chapter => {
      const data = getData(chapter);
      Object.keys(data).forEach(key => {
        // Don't track excluded fields, temp markers, or deletion markers
        if (!excludeFields.includes(key) && 
            key !== 'isTemp' && 
            key !== 'pendingDeletion' && 
            key !== 'deletedAt') {
          fields.add(key);
        }
      });
    });
    
    return fields;
  }, [excludeFields]);

  // Initialize tracked fields from initial data
  useEffect(() => {
    if (initialChapters.length > 0 && trackedFields.current.size === 0) {
      trackedFields.current = detectFields(initialChapters);
      console.log('Tracking fields:', Array.from(trackedFields.current));
    }
  }, [initialChapters, detectFields]);

  // Create a comparable object with all tracked fields
  const createComparableObject = (chapter) => {
    const data = getData(chapter);
    const comparable = {};
    
    // Include all tracked fields
    trackedFields.current.forEach(field => {
      if (field in data) {
        comparable[field] = normalize(data[field]);
      }
    });
    
    // Always include isArchived if it exists
    if ('isArchived' in data) {
      comparable.isArchived = data.isArchived;
    }
    
    return comparable;
  };

  // Check if two chapters have differences in any tracked field
  const hasFieldChanges = (origData, newData) => {
    // Check all tracked fields
    for (const field of trackedFields.current) {
      const origValue = normalize(origData[field]);
      const newValue = normalize(newData[field]);
      
      if (origValue !== newValue) {
        return true;
      }
    }
    return false;
  };

  function renumberChapters(chaptersList) {
    let chapterNumber = 1;
    return chaptersList.map(chapter => {
      const chapterData = getData(chapter);
      
      if (chapter.pendingDeletion || chapterData.isArchived) {
        return chapter;
      }
      
      const newNumber = chapterNumber++;
      
      if (chapter[dataWrapper]) {
        return {
          ...chapter,
          [dataWrapper]: {
            ...chapterData,
            [numberField]: newNumber
          }
        };
      } else {
        return {
          ...chapter,
          [numberField]: newNumber
        };
      }
    });
  }

  function sortChaptersByNumber(chaptersList) {
    return [...chaptersList].sort((a, b) => {
      const aNum = getData(a)[numberField] || 0;
      const bNum = getData(b)[numberField] || 0;
      return aNum - bNum;
    });
  }

  // Initialize original state
  useEffect(() => {
    if (initialChapters.length > 0 && !originalState.current) {
      // Update tracked fields with initial data
      trackedFields.current = detectFields(initialChapters);
      
      originalState.current = JSON.stringify(
        initialChapters
          .map(createComparableObject)
          .sort((a, b) => (a[numberField] || 0) - (b[numberField] || 0))
      );
    }
  }, [initialChapters]);

  const checkIfOriginalStateRestored = useCallback((currentChapters) => {
    if (!originalState.current) return false;
    
    // Never consider state restored if there are temp chapters
    if (currentChapters.some(ch => ch.isTemp)) {
      return false;
    }
    
    // Never consider state restored if there are pending deletions
    if (currentChapters.some(ch => ch.pendingDeletion)) {
      return false;
    }
    
    // Filter out temp chapters and deleted chapters
    const activeChapters = currentChapters.filter(ch => 
      !ch.isTemp && !ch.pendingDeletion
    );
    
    // Create comparable state
    const currentState = JSON.stringify(
      activeChapters
        .map(createComparableObject)
        .sort((a, b) => (a[numberField] || 0) - (b[numberField] || 0))
    );
    
    // Parse and normalize the original state for comparison
    const originalData = JSON.parse(originalState.current);
    const normalizedOriginal = JSON.stringify(
      originalData
        .map(ch => {
          const normalized = {};
          Object.keys(ch).forEach(key => {
            normalized[key] = normalize(ch[key]);
          });
          return normalized;
        })
        .sort((a, b) => (a[numberField] || 0) - (b[numberField] || 0))
    );
    
    return currentState === normalizedOriginal;
  }, [normalize, numberField]);

  const reset = useCallback((newChapters) => {
    const cleanChapters = newChapters.filter(ch => !ch.isTemp);
    const sorted = sortChaptersByNumber(cleanChapters);
    
    // Update tracked fields with new data
    if (cleanChapters.length > 0) {
      trackedFields.current = detectFields(cleanChapters);
    }
    
    setChapters(sorted);
    originalChapters.current = cleanChapters;
    originalOrder.current = cleanChapters.map(c => getData(c)[identifierField]);
    
    // Store original state
    originalState.current = JSON.stringify(
      cleanChapters
        .map(createComparableObject)
        .sort((a, b) => (a[numberField] || 0) - (b[numberField] || 0))
    );
    
    setPendingChanges({
      added: [],
      modified: [],
      deleted: [],
      reordered: false
    });
  }, [detectFields]);

  const addChapter = useCallback((chapterData) => {
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    
    // Update tracked fields if new fields are introduced
    const newFields = Object.keys(chapterData);
    newFields.forEach(field => {
      if (!excludeFields.includes(field) && 
          field !== 'isTemp' && 
          field !== 'pendingDeletion') {
        trackedFields.current.add(field);
      }
    });
    
    const maxNumber = chapters.reduce((max, ch) => {
      const num = getData(ch)[numberField] || 0;
      return Math.max(max, num);
    }, 0);
    
    const newChapter = {
      ...chapterData,
      [identifierField]: tempId,
      [numberField]: chapterData[numberField] || maxNumber + 1,
      isTemp: true,
    };

    setChapters(prev => {
      const exists = prev.some(ch => {
        const chData = getData(ch);
        return chData.title === newChapter.title && 
               chData[numberField] === newChapter[numberField] &&
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
  }, [chapters, excludeFields, identifierField, numberField]);

  const updateChapter = useCallback((chapterId, updates) => {
    // Update tracked fields if new fields are introduced
    Object.keys(updates).forEach(field => {
      if (!excludeFields.includes(field) && 
          field !== 'isTemp' && 
          field !== 'pendingDeletion') {
        trackedFields.current.add(field);
      }
    });

    setChapters(prev => {
      let updatedChapters = [...prev];
      const chapterIndex = updatedChapters.findIndex(ch => 
        getData(ch)[identifierField] === chapterId
      );
      
      if (chapterIndex === -1) return prev;
      
      const chapter = updatedChapters[chapterIndex];
      
      if (chapter.pendingDeletion) return prev;
      
      const oldNumber = getData(chapter)[numberField];
      
      // Handle chapter number changes
      if (updates[numberField] !== undefined && updates[numberField] !== oldNumber) {
        const newNumber = updates[numberField];
        
        const activeChapters = updatedChapters.filter(ch => 
          !ch.pendingDeletion && !getData(ch).isArchived
        );
        const maxNumber = activeChapters.length;
        
        const targetNumber = Math.max(1, Math.min(newNumber, maxNumber + 1));
        
        const updatedChapter = {
          ...chapter,
          ...(chapter[dataWrapper] ? { 
            [dataWrapper]: { ...getData(chapter), ...updates, [numberField]: targetNumber } 
          } : { ...updates, [numberField]: targetNumber })
        };
        
        updatedChapters[chapterIndex] = updatedChapter;
        
        // Renumber affected chapters
        updatedChapters = updatedChapters.map((ch, idx) => {
          if (idx === chapterIndex) return ch;
          
          const chData = getData(ch);
          if (ch.pendingDeletion || chData.isArchived) return ch;
          
          const currentNum = chData[numberField];
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
            if (ch[dataWrapper]) {
              return {
                ...ch,
                [dataWrapper]: { ...chData, [numberField]: newNum }
              };
            } else {
              return { ...ch, [numberField]: newNum };
            }
          }
          
          return ch;
        });
        
        updatedChapters = sortChaptersByNumber(updatedChapters);
      } else {
        // Regular update without number change
        const updatedChapter = {
          ...chapter,
          ...(chapter[dataWrapper] ? { 
            [dataWrapper]: { ...getData(chapter), ...updates } 
          } : updates)
        };
        
        updatedChapters[chapterIndex] = updatedChapter;
      }
      
      // Check for temp chapters
      const hasTempChapters = updatedChapters.some(ch => ch.isTemp);
      const hasPendingDeletions = updatedChapters.some(ch => ch.pendingDeletion);
      
      // Only check for restoration if no temp chapters or pending deletions
      if (!hasTempChapters && !hasPendingDeletions && checkIfOriginalStateRestored(updatedChapters)) {
        setPendingChanges({
          added: [],
          modified: [],
          deleted: [],
          reordered: false
        });
      } else {
        // Update pending changes
        if (!chapter.isTemp) {
          setPendingChanges(current => {
            const existingModified = current.modified.filter(c => 
              getData(c)[identifierField] !== chapterId
            );
            
            const originalChapter = originalChapters.current.find(c => 
              getData(c)[identifierField] === chapterId
            );
            
            if (originalChapter) {
              const origData = getData(originalChapter);
              const newData = getData(updatedChapters[chapterIndex]);
              
              const hasChanges = hasFieldChanges(origData, newData);
              
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
          // Update the temp chapter in the added array
          setPendingChanges(current => ({
            ...current,
            added: current.added.map(c => 
              c[identifierField] === chapterId ? updatedChapters[chapterIndex] : c
            )
          }));
        }
      }
      
      return updatedChapters;
    });
  }, [checkIfOriginalStateRestored, excludeFields, identifierField, numberField, dataWrapper]);

  const deleteChapter = useCallback((chapterId) => {
    setChapters(prev => {
      const chapterToDelete = prev.find(c => getData(c)[identifierField] === chapterId);
      
      if (!chapterToDelete) return prev;
      
      if (chapterToDelete?.isTemp) {
        const filtered = prev.filter(c => getData(c)[identifierField] !== chapterId);
        const renumbered = renumberChapters(filtered);
        
        setPendingChanges(current => ({
          ...current,
          added: current.added.filter(c => c[identifierField] !== chapterId)
        }));
        
        return sortChaptersByNumber(renumbered);
      }
      
      const updatedChapters = prev.map(ch => {
        if (getData(ch)[identifierField] === chapterId) {
          return { ...ch, pendingDeletion: true, deletedAt: Date.now() };
        }
        return ch;
      });
      
      setPendingChanges(current => {
        const modified = current.modified.filter(c => getData(c)[identifierField] !== chapterId);
        
        const alreadyDeleted = current.deleted.some(c => getData(c)[identifierField] === chapterId);
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
  }, [identifierField]);

  const undoDeleteChapter = useCallback((chapterId) => {
    setChapters(prev => {
      const updatedChapters = prev.map(ch => {
        if (getData(ch)[identifierField] === chapterId) {
          const { pendingDeletion, deletedAt, ...cleanChapter } = ch;
          return cleanChapter;
        }
        return ch;
      });
      
      // Check if we're back to original state
      const hasTempChapters = updatedChapters.some(ch => ch.isTemp);
      const hasPendingDeletions = updatedChapters.some(ch => ch.pendingDeletion);
      
      if (!hasTempChapters && !hasPendingDeletions && checkIfOriginalStateRestored(updatedChapters)) {
        setPendingChanges({
          added: [],
          modified: [],
          deleted: [],
          reordered: false
        });
      } else {
        setPendingChanges(current => ({
          ...current,
          deleted: current.deleted.filter(c => getData(c)[identifierField] !== chapterId)
        }));
      }
      
      return updatedChapters;
    });
  }, [checkIfOriginalStateRestored, identifierField]);

  const reorderChapters = useCallback((reorderedChapters) => {
    setChapters(sortChaptersByNumber(reorderedChapters));
    
    // Check if we're back to original state
    const hasTempChapters = reorderedChapters.some(ch => ch.isTemp);
    const hasPendingDeletions = reorderedChapters.some(ch => ch.pendingDeletion);
    
    if (!hasTempChapters && !hasPendingDeletions && checkIfOriginalStateRestored(reorderedChapters)) {
      setPendingChanges({
        added: [],
        modified: [],
        deleted: [],
        reordered: false
      });
    } else {
      // Update modified and reordered status
      const modifiedChapters = reorderedChapters.filter(c => 
        !c.isTemp && !c.pendingDeletion && !getData(c).isArchived
      );
      
      setPendingChanges(prev => {
        const modifiedIds = new Set(prev.modified.map(c => getData(c)[identifierField]));
        const newModified = [...prev.modified];
        
        modifiedChapters.forEach(chapter => {
          const chapterId = getData(chapter)[identifierField];
          const originalChapter = originalChapters.current.find(c => 
            getData(c)[identifierField] === chapterId
          );
          
          if (originalChapter) {
            const origData = getData(originalChapter);
            const newData = getData(chapter);
            
            const hasChanges = hasFieldChanges(origData, newData);
            
            if (hasChanges && !modifiedIds.has(chapterId)) {
              newModified.push(chapter);
            } else if (!hasChanges && modifiedIds.has(chapterId)) {
              const index = newModified.findIndex(c => getData(c)[identifierField] === chapterId);
              if (index !== -1) {
                newModified.splice(index, 1);
              }
            }
          }
        });
        
        const currentOrder = reorderedChapters
          .filter(c => !c.isTemp && !c.pendingDeletion && !getData(c).isArchived)
          .map(c => getData(c)[identifierField]);
        
        const isReordered = JSON.stringify(currentOrder) !== JSON.stringify(originalOrder.current);
        
        return {
          ...prev,
          modified: newModified,
          reordered: isReordered
        };
      });
    }
  }, [checkIfOriginalStateRestored, identifierField]);

  const hasChanges = useCallback(() => {
    return pendingChanges.added.length > 0 ||
           pendingChanges.modified.length > 0 ||
           pendingChanges.deleted.length > 0 ||
           pendingChanges.reordered;
  }, [pendingChanges]);

  const getChanges = useCallback(() => {
    const uniqueAdded = pendingChanges.added.filter((chapter, index, self) => {
      const chapterData = getData(chapter);
      return index === self.findIndex(ch => {
        const chData = getData(ch);
        return chData.title === chapterData.title && 
               chData[numberField] === chapterData[numberField];
      });
    });
    
    return {
      ...pendingChanges,
      added: uniqueAdded,
      currentOrder: chapters.filter(ch => !ch.pendingDeletion && !getData(ch).isArchived)
    };
  }, [pendingChanges, chapters, numberField]);

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
    reset,
    trackedFields: Array.from(trackedFields.current) // Expose tracked fields for debugging
  };
}