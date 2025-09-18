// backend/domains/instructor/instructor.service.js
const { courseInstructors } = require("../../config/schema");
const { eq } = require("drizzle-orm");

const instructorService = {
  /**
   * Link instructor to courses - used by create and update
   */
  async linkCourses(tx, instructorId, courseIds) {
    if (courseIds?.length > 0) {
      await tx.insert(courseInstructors).values(
        courseIds.map((cid) => ({
          courseId: cid,
          instructorId,
        }))
      );
    }
  },

  /**
   * Update course relationships - used by update
   */
  async updateCourses(tx, instructorId, courseIds) {
    // Remove existing relationships
    await tx.delete(courseInstructors).where(eq(courseInstructors.instructorId, instructorId));
    
    // Add new relationships
    await this.linkCourses(tx, instructorId, courseIds);
  },
};

module.exports = instructorService;