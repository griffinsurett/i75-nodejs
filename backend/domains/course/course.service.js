// backend/domains/section/section.service.js
const { chapters } = require("../../config/schema");
const { eq, count } = require("drizzle-orm");

const sectionService = {
  /**
   * Helper functions for section operations
   */
  async getChapterCount(tx, sectionId) {
    const result = await tx
      .select({ count: count() })
      .from(chapters)
      .where(eq(chapters.sectionId, sectionId));
    
    return Number(result[0]?.count || 0);
  },
};

module.exports = sectionService;