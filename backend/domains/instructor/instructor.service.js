// backend/domains/instructor/instructor.service.js
const { courseInstructors, courses, images } = require("../../config/schema");
const { eq, desc, inArray } = require("drizzle-orm");

const instructorService = {
  /**
   * Get courses for an instructor
   */
  async getInstructorCourses(db, instructorId) {
    return await db
      .select({
        course_id: courses.courseId,
        course_name: courses.courseName,
        description: courses.description,
        created_at: courses.createdAt,
        updated_at: courses.updatedAt,
        course_image: images.imageUrl,
        is_archived: courses.isArchived,
      })
      .from(courses)
      .innerJoin(courseInstructors, eq(courses.courseId, courseInstructors.courseId))
      .leftJoin(images, eq(courses.imageId, images.imageId))
      .where(eq(courseInstructors.instructorId, instructorId))
      .orderBy(desc(courses.createdAt));
  },

  /**
   * Update course assignments for an instructor
   */
  async updateCourseAssignments(tx, instructorId, courseIds) {
    // Remove existing assignments
    await tx
      .delete(courseInstructors)
      .where(eq(courseInstructors.instructorId, instructorId));

    // Add new assignments
    if (courseIds.length > 0) {
      // Verify all courses exist
      const existingCourses = await tx
        .select({ courseId: courses.courseId })
        .from(courses)
        .where(inArray(courses.courseId, courseIds));

      const existingIds = existingCourses.map(c => c.courseId);
      const missingIds = courseIds.filter(id => !existingIds.includes(id));

      if (missingIds.length > 0) {
        throw new Error(`Courses not found: ${missingIds.join(", ")}`);
      }

      // Create new assignments
      await tx.insert(courseInstructors).values(
        courseIds.map((courseId) => ({
          instructorId,
          courseId,
        }))
      );
    }
  },

  /**
   * Check if instructor can be deleted/archived
   */
  async canModifyInstructor(db, instructorId) {
    const assignments = await db
      .select({ count: courseInstructors.instructorId })
      .from(courseInstructors)
      .where(eq(courseInstructors.instructorId, instructorId));

    return Number(assignments[0]?.count || 0) === 0;
  },
};

module.exports = instructorService;