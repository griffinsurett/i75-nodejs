// frontend/src/components/search/utils/searchUtils.js

/**
 * Generic text search function
 * @param {Array} data - Array of objects to search
 * @param {string} query - Search query
 * @param {Array} fields - Fields to search in
 * @param {Object} options - Search options
 */
export const textSearch = (data, query, fields = [], options = {}) => {
  const {
    caseSensitive = false,
    exactMatch = false,
    highlightMatches = false,
  } = options;

  if (!query.trim()) return data;

  const searchQuery = caseSensitive ? query : query.toLowerCase();

  return data.filter(item => {
    return fields.some(field => {
      const value = getNestedValue(item, field);
      if (value == null) return false;

      const searchValue = caseSensitive ? String(value) : String(value).toLowerCase();
      
      return exactMatch 
        ? searchValue === searchQuery
        : searchValue.includes(searchQuery);
    });
  });
};

/**
 * Fuzzy search implementation
 * @param {Array} data - Array of objects to search
 * @param {string} query - Search query
 * @param {Array} fields - Fields to search in
 * @param {Object} options - Search options
 */
export const fuzzySearch = (data, query, fields = [], options = {}) => {
  const {
    threshold = 0.6, // Minimum similarity score (0-1)
    caseSensitive = false,
  } = options;

  if (!query.trim()) return data;

  const searchQuery = caseSensitive ? query : query.toLowerCase();

  return data
    .map(item => {
      let bestScore = 0;
      
      fields.forEach(field => {
        const value = getNestedValue(item, field);
        if (value == null) return;

        const searchValue = caseSensitive ? String(value) : String(value).toLowerCase();
        const score = calculateSimilarity(searchQuery, searchValue);
        bestScore = Math.max(bestScore, score);
      });

      return { item, score: bestScore };
    })
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
};

/**
 * Multi-field search with weighting
 * @param {Array} data - Array of objects to search
 * @param {string} query - Search query
 * @param {Object} fieldWeights - Object mapping field names to weights
 */
export const weightedSearch = (data, query, fieldWeights = {}, options = {}) => {
  const { caseSensitive = false } = options;
  
  if (!query.trim()) return data;

  const searchQuery = caseSensitive ? query : query.toLowerCase();

  return data
    .map(item => {
      let totalScore = 0;
      let totalWeight = 0;

      Object.entries(fieldWeights).forEach(([field, weight]) => {
        const value = getNestedValue(item, field);
        if (value == null) return;

        const searchValue = caseSensitive ? String(value) : String(value).toLowerCase();
        
        if (searchValue.includes(searchQuery)) {
          totalScore += weight;
        }
        totalWeight += weight;
      });

      return {
        item,
        score: totalWeight > 0 ? totalScore / totalWeight : 0
      };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
};

/**
 * Tag-based search
 * @param {Array} data - Array of objects to search
 * @param {Array} tags - Array of tags to search for
 * @param {string} tagField - Field containing tags
 * @param {Object} options - Search options
 */
export const tagSearch = (data, tags, tagField = 'tags', options = {}) => {
  const { matchAll = false } = options; // true = AND, false = OR
  
  if (!tags.length) return data;

  return data.filter(item => {
    const itemTags = getNestedValue(item, tagField) || [];
    
    if (matchAll) {
      // All tags must be present
      return tags.every(tag => itemTags.includes(tag));
    } else {
      // At least one tag must be present
      return tags.some(tag => itemTags.includes(tag));
    }
  });
};

/**
 * Date range search
 * @param {Array} data - Array of objects to search
 * @param {string} dateField - Field containing the date
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 */
export const dateRangeSearch = (data, dateField, startDate, endDate) => {
  return data.filter(item => {
    const itemDate = new Date(getNestedValue(item, dateField));
    return itemDate >= startDate && itemDate <= endDate;
  });
};

/**
 * Numeric range search
 * @param {Array} data - Array of objects to search
 * @param {string} field - Field to search in
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 */
export const numericRangeSearch = (data, field, min, max) => {
  return data.filter(item => {
    const value = Number(getNestedValue(item, field));
    return !isNaN(value) && value >= min && value <= max;
  });
};

/**
 * Advanced search with multiple criteria
 * @param {Array} data - Array of objects to search
 * @param {Object} criteria - Search criteria object
 */
export const advancedSearch = (data, criteria) => {
  let results = data;

  // Text search
  if (criteria.text && criteria.textFields) {
    results = textSearch(results, criteria.text, criteria.textFields, criteria.textOptions);
  }

  // Tag search
  if (criteria.tags && criteria.tags.length > 0) {
    results = tagSearch(results, criteria.tags, criteria.tagField, criteria.tagOptions);
  }

  // Date range search
  if (criteria.dateField && criteria.startDate && criteria.endDate) {
    results = dateRangeSearch(results, criteria.dateField, criteria.startDate, criteria.endDate);
  }

  // Numeric range search
  if (criteria.numericField && (criteria.minValue !== undefined || criteria.maxValue !== undefined)) {
    const min = criteria.minValue !== undefined ? criteria.minValue : -Infinity;
    const max = criteria.maxValue !== undefined ? criteria.maxValue : Infinity;
    results = numericRangeSearch(results, criteria.numericField, min, max);
  }

  return results;
};

/**
 * Helper function to get nested object values using dot notation
 */
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

/**
 * Calculate string similarity using Levenshtein distance
 */
const calculateSimilarity = (str1, str2) => {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const distance = matrix[len2][len1];
  return 1 - distance / Math.max(len1, len2);
};

/**
 * Highlight search matches in text
 * @param {string} text - Text to highlight
 * @param {string} query - Search query
 * @param {string} highlightClass - CSS class for highlighting
 */
export const highlightMatches = (text, query, highlightClass = 'bg-yellow-200') => {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  return text.replace(regex, `<span class="${highlightClass}">$1</span>`);
};

/**
 * Escape special regex characters
 */
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Search result statistics
 * @param {Array} originalData - Original data array
 * @param {Array} filteredData - Filtered data array
 * @param {string} query - Search query
 */
export const getSearchStats = (originalData, filteredData, query) => {
  return {
    totalItems: originalData.length,
    filteredItems: filteredData.length,
    searchQuery: query,
    isSearchActive: query.trim().length > 0,
    hasResults: filteredData.length > 0,
    filteredPercentage: originalData.length > 0 
      ? Math.round((filteredData.length / originalData.length) * 100)
      : 0,
  };
};