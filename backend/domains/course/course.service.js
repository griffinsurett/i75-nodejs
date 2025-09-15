// ==================== domains/course/course.service.js ====================
const { db } = require("../../config/database");
const {
  courses,
  images,
  videos,
  instructors,
  courseInstructors,
} = require("../../config/schema");
const { eq, count } = require("drizzle-orm");
const imageService = require("../media/image/image.service");

/**
 * Standard field mappings - use these everywhere to avoid duplication
 */
const COURSE_FIELDS = {
  course_id: courses.courseId,
  course_name: courses.courseName,
  description: courses.description,
  image_id: courses.imageId,
  video_id: courses.videoId,
  created_at: courses.createdAt,
  updated_at: courses.updatedAt,
  is_archived: courses.isArchived,
  archived_at: courses.archivedAt,
  purge_after_at: courses.purgeAfterAt,
  course_image: images.imageUrl,
  video_title: videos.title,
  video_description: videos.description,
};

const INSTRUCTOR_FIELDS = {
  instructor_id: instructors.instructorId,
  name: instructors.name,
  bio: instructors.bio,
  instructor_image: images.imageUrl,
};

const courseService = {
  // Field mappings - export these for reuse
  COURSE_FIELDS,
  INSTRUCTOR_FIELDS,

  /**
   * Handle image creation/linking for courses
   */
  async handleCourseImage(tx, { image_id, image_url, alt_text }) {
    return await imageService.handleImageCreation(tx, { image_id, image_url, alt_text });
  },

  /**
   * Handle image updates for courses
   */
  async updateCourseImage(tx, currentImageId, { image_id, image_url, alt_text }) {
    return await imageService.handleImageUpdate(tx, currentImageId, { image_id, image_url, alt_text });
  },

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