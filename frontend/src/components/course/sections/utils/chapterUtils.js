// chapterUtils.js
/**
 * Reorder chapters after drag and drop
 * Chapters will be automatically renumbered based on their position
 * @param {Array} chapters - Array of chapters
 * @param {number} fromIndex - Starting position
 * @param {number} toIndex - Ending position
 * @returns {Array} - Reordered chapters
 */
export const reorderChapters = (chapters, fromIndex, toIndex) => {
  const result = [...chapters];
  const [movedChapter] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, movedChapter);
  
  // The renumbering will be handled by the hook
  return result;
};

/**
 * Get the default next chapter number (for new chapters)
 * @param {Array} chapters - Array of existing chapters
 * @returns {number} - The next sequential chapter number
 */
export const getDefaultNextChapterNumber = (chapters) => {
  return chapters.length + 1;
};