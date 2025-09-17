import { useState, useEffect, useCallback } from 'react';

export default function useSelectionMode() {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  // Clear selection when mode is disabled
  useEffect(() => {
    if (!selectionMode) {
      setSelectedItems(new Set());
    }
  }, [selectionMode]);

  const toggleItemSelection = useCallback((itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((items) => {
    setSelectedItems(new Set(items));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const isSelected = useCallback((itemId) => {
    return selectedItems.has(itemId);
  }, [selectedItems]);

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => !prev);
    if (selectionMode) {
      clearSelection();
    }
  }, [selectionMode, clearSelection]);

  return {
    selectedItems,
    selectionMode,
    setSelectionMode,
    toggleItemSelection,
    selectAll,
    clearSelection,
    isSelected,
    toggleSelectionMode,
    selectedCount: selectedItems.size
  };
}