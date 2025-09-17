// backend/domains/course/course.service.js
const { courseInstructors } = require("../../config/schema");
const { eq } = require("drizzle-orm");

const courseService = {
  /**
   * Link instructors to course - used by create and update
   */
  async linkInstructors(tx, courseId, instructorIds) {
    if (instructorIds?.length > 0) {
      await tx.insert(courseInstructors).values(
        instructorIds.map((iid) => ({
          courseId,
          instructorId: iid,
        }))
      );
    }
  },

  /**
   * Update instructor relationships - used by update
   */
  async updateInstructors(tx, courseId, instructorIds) {
    // Remove existing relationships
    await tx.delete(courseInstructors).where(eq(courseInstructors.courseId, courseId));
    
    // Add new relationships
    await this.linkInstructors(tx, courseId, instructorIds);
  },
};

module.exports = courseService;