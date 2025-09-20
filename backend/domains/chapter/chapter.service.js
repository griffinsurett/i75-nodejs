// backend/domains/chapter/chapter.service.js
const { tests, entries } = require("../../config/schema");
const { eq, count } = require("drizzle-orm");

const chapterService = {
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
};

module.exports = chapterService;