// backend/domains/chapter/chapter.service.js
const { tests, entries, chapters } = require("../../config/schema");
const { eq, count, sql, max, and } = require("drizzle-orm");

const chapterService = {
  /**
   * Get the next available chapter number for a section
   */
  async getNextChapterNumber(tx, sectionId) {
    const result = await tx
      .select({ maxNumber: max(chapters.chapterNumber) })
      .from(chapters)
      .where(eq(chapters.sectionId, sectionId));
    
    const currentMax = result[0]?.maxNumber || 0;
    return currentMax + 1;
  },

  /**
   * Renumber chapters after deletion to maintain sequential order
   * Optional - use if you want to keep numbers sequential without gaps
   */
  async renumberChapters(tx, sectionId) {
    // Get all non-archived chapters for the section, ordered by current number
    const sectionChapters = await tx
      .select()
      .from(chapters)
      .where(
        and(
          eq(chapters.sectionId, sectionId),
          eq(chapters.isArchived, false)
        )
      )
      .orderBy(chapters.chapterNumber);
    
    // Update each chapter with new sequential number
    for (let i = 0; i < sectionChapters.length; i++) {
      const newNumber = i + 1;
      if (sectionChapters[i].chapterNumber !== newNumber) {
        await tx
          .update(chapters)
          .set({ 
            chapterNumber: newNumber,
            updatedAt: new Date()
          })
          .where(eq(chapters.chapterId, sectionChapters[i].chapterId));
      }
    }
  },

  /**
   * Get test count for a chapter
   */
  async getTestCount(tx, chapterId) {
    const result = await tx
      .select({ count: count() })
      .from(tests)
      .where(eq(tests.chapterId, chapterId));
    
    return Number(result[0]?.count || 0);
  },

  /**
   * Get entry count for a chapter
   */
  async getEntryCount(tx, chapterId) {
    const result = await tx
      .select({ count: count() })
      .from(entries)
      .where(eq(entries.chapterId, chapterId));
    
    return Number(result[0]?.count || 0);
  },

  /**
   * Check if chapter can be deleted
   */
  async canDelete(tx, chapterId) {
    const testCount = await this.getTestCount(tx, chapterId);
    const entryCount = await this.getEntryCount(tx, chapterId);
    
    return testCount === 0 && entryCount === 0;
  },

  /**
   * Get all chapters for a section ordered by chapter number
   */
  async getSectionChapters(tx, sectionId, includeArchived = false) {
    let query = tx
      .select()
      .from(chapters);
    
    if (!includeArchived) {
      query = query.where(
        and(
          eq(chapters.sectionId, sectionId),
          eq(chapters.isArchived, false)
        )
      );
    } else {
      query = query.where(eq(chapters.sectionId, sectionId));
    }
    
    return query.orderBy(chapters.chapterNumber);
  },

  /**
   * Validate chapter number is unique within section
   */
  async isChapterNumberUnique(tx, sectionId, chapterNumber, excludeChapterId = null) {
    const conditions = [
      eq(chapters.sectionId, sectionId),
      eq(chapters.chapterNumber, chapterNumber)
    ];
    
    if (excludeChapterId) {
      conditions.push(sql`${chapters.chapterId} != ${excludeChapterId}`);
    }
    
    const result = await tx
      .select({ count: count() })
      .from(chapters)
      .where(and(...conditions));
    
    return Number(result[0]?.count || 0) === 0;
  },
};

module.exports = chapterService;