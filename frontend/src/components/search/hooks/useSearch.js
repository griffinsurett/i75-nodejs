// frontend/src/components/search/hooks/useSearch.js
import { useState, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';

/**
 * Custom hook for search functionality
 * @param {Array} data - The data array to search through
 * @param {Object} options - Configuration options
 * @param {Array} options.searchFields - Fields to search in (e.g., ['title', 'description'])
 * @param {number} options.debounceMs - Debounce delay in milliseconds (default: 300)
 * @param {boolean} options.caseSensitive - Whether search is case sensitive (default: false)
 * @param {Function} options.customFilter - Custom filter function
 * @returns {Object} Search state and methods
 */
export const useSearch = (data = [], options = {}) => {
  const {
    searchFields = [],
    debounceMs = 300,
    caseSensitive = false,
    customFilter = null,
  } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounced search query update
  const debouncedSetQuery = useMemo(
    () => debounce((query) => {
      setDebouncedQuery(query);
    }, debounceMs),
    [debounceMs]
  );

  // Update search query and trigger debounced search
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
    debouncedSetQuery(query);
  }, [debouncedSetQuery]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    debouncedSetQuery.cancel();
  }, [debouncedSetQuery]);

  // Filtered data based on search query
  const filteredData = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return data;
    }

    // Use custom filter if provided
    if (customFilter && typeof customFilter === 'function') {
      return customFilter(data, debouncedQuery);
    }

    // Default search implementation
    const query = caseSensitive ? debouncedQuery : debouncedQuery.toLowerCase();
    
    return data.filter((item) => {
      // If no search fields specified, convert entire item to string and search
      if (searchFields.length === 0) {
        const itemString = JSON.stringify(item);
        const searchString = caseSensitive ? itemString : itemString.toLowerCase();
        return searchString.includes(query);
      }

      // Search in specified fields
      return searchFields.some((field) => {
        const fieldValue = getNestedValue(item, field);
        if (fieldValue == null) return false;
        
        const searchString = caseSensitive 
          ? String(fieldValue) 
          : String(fieldValue).toLowerCase();
        
        return searchString.includes(query);
      });
    });
  }, [data, debouncedQuery, searchFields, caseSensitive, customFilter]);

  // Search statistics
  const searchStats = useMemo(() => ({
    totalItems: data.length,
    filteredItems: filteredData.length,
    isSearching: debouncedQuery.trim().length > 0,
    hasResults: filteredData.length > 0,
  }), [data.length, filteredData.length, debouncedQuery]);

  return {
    // State
    searchQuery,
    debouncedQuery,
    filteredData,
    searchStats,
    
    // Methods
    setSearchQuery: handleSearchChange,
    clearSearch,
    
    // Computed
    isSearchActive: debouncedQuery.trim().length > 0,
    hasResults: filteredData.length > 0,
  };
};

// Helper function to get nested object values using dot notation
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

export default useSearch;