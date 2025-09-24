// backend/domains/course/course.controller.js
const { db } = require("../../config/database");
const {
  courses,
  images,
  videos,
  instructors,
  courseInstructors,
  sections,
} = require("../../config/schema");
const { eq, desc } = require("drizzle-orm");
const courseService = require("./course.service");
const mediaManager = require("../../shared/utils/mediaManager");
const BaseController = require("../../shared/utils/baseController");

const TimeUntilDeletion = 60000;

class CourseController extends BaseController {
  // Schema for all media operations
  get mediaSchema() {
    return {
      courses,
      images,
      videos,
      sections,
      instructors,
    };
  }

  // Simplified schema for image operations
  get imageSchema() {
    return { images, videos };
  }

  /**
   * GET /api/courses - Get all courses with optional archive filter
   */
  async getAllCourses(req, res, next) {
    try {
      const showArchived = String(req.query.archived || "").toLowerCase() === "true";

      const result = await db
        .select()
        .from(courses)
        .leftJoin(images, eq(courses.imageId, images.imageId))
        .leftJoin(videos, eq(courses.videoId, videos.videoId))
        .where(eq(courses.isArchived, showArchived))
        .orderBy(desc(courses.createdAt));

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/courses/:courseId - Get single course with instructors
   */
  async getCourseById(req, res, next) {
    try {
      const { courseId } = req.params;

      const courseResult = await db
        .select()
        .from(courses)
        .leftJoin(images, eq(courses.imageId, images.imageId))
        .leftJoin(videos, eq(courses.videoId, videos.videoId))
        .where(eq(courses.courseId, courseId));

      if (courseResult.length === 0) {
        this.throwNotFound("Course");
      }

      const instructorsResult = await db
        .select()
        .from(instructors)
        .innerJoin(
          courseInstructors,
          eq(instructors.instructorId, courseInstructors.instructorId)
        )
        .leftJoin(images, eq(instructors.imageId, images.imageId))
        .where(eq(courseInstructors.courseId, courseId));

      const course = courseResult[0];
      course.courses.instructors = instructorsResult;

      this.success(res, course);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/courses/:courseId/sections - Get sections for a course
   */
  async getCourseSections(req, res, next) {
    try {
      const { courseId } = req.params;

      const courseExists = await this.checkRelatedCount(
        db,
        courses,
        courses.courseId,
        courseId
      );

      if (courseExists === 0) {
        this.throwNotFound("Course");
      }

      const result = await db
        .select()
        .from(sections)
        .leftJoin(images, eq(sections.imageId, images.imageId))
        .leftJoin(videos, eq(sections.videoId, videos.videoId))
        .where(eq(sections.courseId, courseId))
        .orderBy(sections.title);

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/courses - Create new course
   */
  async createCourse(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const {
          courseName,
          description,
          imageId,
          imageUrl,
          altText,
          videoId,
          instructorIds,
        } = req.body;

        const validatedCourseName = this.validateRequired(courseName, "Course name");

        const finalImageId = await mediaManager.handleImage(
          tx,
          { image_id: imageId, image_url: imageUrl, alt_text: altText },
          this.imageSchema
        );

        const [course] = await tx
          .insert(courses)
          .values({
            courseName: validatedCourseName,
            description: description || null,
            imageId: finalImageId,
            videoId: videoId || null,
          })
          .returning();

        if (instructorIds?.length > 0) {
          await courseService.linkInstructors(tx, course.courseId, instructorIds);
        }

        return course;
      });

      this.success(res, result, null, 201);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * PUT /api/courses/:courseId - Update course
   */
  async updateCourse(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const { courseId } = req.params;
        const {
          courseName,
          description,
          imageId,
          imageUrl,
          altText,
          videoId,
          instructorIds,
        } = req.body;

        const existing = await this.getOrThrow(tx, courses, courses.courseId, courseId, "Course");

        const currentImageId = await mediaManager.updateImage(
          tx,
          existing.imageId,
          { image_id: imageId, image_url: imageUrl, alt_text: altText },
          this.imageSchema
        );

        const updateFields = { updatedAt: new Date() };
        if (courseName !== undefined) updateFields.courseName = courseName;
        if (description !== undefined) updateFields.description = description;
        if (videoId !== undefined) updateFields.videoId = videoId;
        if (currentImageId !== undefined) updateFields.imageId = currentImageId;

        const [updated] = await tx
          .update(courses)
          .set(updateFields)
          .where(eq(courses.courseId, courseId))
          .returning();

        if (instructorIds !== undefined) {
          await courseService.updateInstructors(tx, courseId, instructorIds);
        }

        return updated;
      });

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/courses/:courseId/archive - Archive course indefinitely
   */
  async archiveCourse(req, res, next) {
    try {
      const { courseId } = req.params;
      const updated = await this.archive(db, courses, courses.courseId, courseId, "Course");
      this.success(res, updated, "Course archived");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/courses/:courseId/restore - Restore archived course
   */
  async restoreCourse(req, res, next) {
    try {
      const { courseId } = req.params;
      const updated = await this.restore(db, courses, courses.courseId, courseId, "Course");
      this.success(res, updated, "Course restored");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * DELETE /api/courses/:courseId - Delete course with automatic cascade
   */
  async deleteCourse(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const { courseId } = req.params;

        const course = await this.getOrThrow(tx, courses, courses.courseId, courseId, "Course");

        const sectionCount = await this.checkRelatedCount(tx, sections, sections.courseId, courseId);
        if (sectionCount > 0) {
          throw this.createError("Cannot delete course with existing sections. Delete sections first.", 400);
        }

        return await mediaManager.deleteWithCascade(
          tx,
          course,
          courses,
          courses.courseId,
          courseId,
          this.mediaSchema,
          TimeUntilDeletion
        );
      });

      let message = "Course scheduled for deletion in 60 seconds.";
      const cascaded = [];
      if (result.image) cascaded.push("image");
      if (result.video) cascaded.push("video");
      if (cascaded.length > 0) {
        message = `Course and its exclusive ${cascaded.join(" and ")} scheduled for deletion in 60 seconds.`;
      }

      this.success(res, result, message);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }
}

module.exports = new CourseController();