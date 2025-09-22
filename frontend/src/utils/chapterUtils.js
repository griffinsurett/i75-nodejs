/**
 * Find the next available chapter number
 * @param {Array} chapters - Array of existing chapters
 * @param {number} desiredNumber - The number we want to use
 * @param {string} excludeChapterId - Chapter ID to exclude from check (for editing)
 * @returns {number} - The next available chapter number
 */
export const getNextAvailableChapterNumber = (chapters, desiredNumber = 1, excludeChapterId = null) => {
  if (!chapters || chapters.length === 0) return desiredNumber;

  // Get all existing chapter numbers (excluding the one being edited)
  const existingNumbers = chapters
    .filter(chapter => {
      const chapterData = chapter.chapters || chapter;
      return chapterData.chapterId !== excludeChapterId;
    })
    .map(chapter => {
      const chapterData = chapter.chapters || chapter;
      return parseInt(chapterData.chapterNumber) || 0;
    })
    .sort((a, b) => a - b);

  // If the desired number is not taken, use it
  if (!existingNumbers.includes(desiredNumber)) {
    return desiredNumber;
  }

  // Find the next available number
  let nextNumber = desiredNumber;
  while (existingNumbers.includes(nextNumber)) {
    nextNumber++;
  }

  return nextNumber;
};

/**
 * Get the default next chapter number (for new chapters)
 * @param {Array} chapters - Array of existing chapters
 * @returns {number} - The next sequential chapter number
 */
export const getDefaultNextChapterNumber = (chapters) => {
  if (!chapters || chapters.length === 0) return 1;

  const maxNumber = Math.max(
    ...chapters.map(chapter => {
      const chapterData = chapter.chapters || chapter;
      return parseInt(chapterData.chapterNumber) || 0;
    })
  );

  return maxNumber + 1;
};

/**
 * Reorder chapters after drag and drop
 * @param {Array} chapters - Array of chapters
 * @param {number} fromIndex - Starting position
 * @param {number} toIndex - Ending position
 * @returns {Array} - Reordered chapters with updated numbers
 */
export const reorderChapters = (chapters, fromIndex, toIndex) => {
  const result = [...chapters];
  const [movedChapter] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, movedChapter);
  
  // Update chapter numbers based on new order
  return result.map((chapter, index) => {
    const chapterData = chapter.chapters || chapter;
    return {
      ...chapter,
      chapters: chapter.chapters ? {
        ...chapterData,
        chapterNumber: index + 1
      } : undefined,
      chapterNumber: !chapter.chapters ? index + 1 : undefined
    };
  });
};