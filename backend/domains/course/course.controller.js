// ==================== domains/course/course.controller.js ====================
const { db } = require("../../config/database");
const {
  courses,
  images,
  videos,
  instructors,
  courseInstructors,
  sections,
  chapters,
  tests,
  options,
  entries,
  optionVideos,
  questionVideos,
} = require("../../config/schema");
const { eq, desc, count } = require("drizzle-orm");
const courseService = require("./course.service");
const mediaManager = require("../../shared/utils/mediaManager");

const TimeUntilDeletion = 6000; 

const courseController = {
  /**
   * GET /api/courses - Get all courses with optional archive filter
   */
  async getAllCourses(req, res, next) {
    try {
      const showArchived =
        String(req.query.archived || "").toLowerCase() === "true";

      const result = await db
        .select(courseService.COURSE_FIELDS)
        .from(courses)
        .leftJoin(images, eq(courses.imageId, images.imageId))
        .leftJoin(videos, eq(courses.videoId, videos.videoId))
        .where(eq(courses.isArchived, showArchived))
        .orderBy(desc(courses.createdAt));

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/courses/:courseId - Get single course with instructors
   */
  async getCourseById(req, res, next) {
    try {
      const { courseId } = req.params;

      const courseResult = await db
        .select(courseService.COURSE_FIELDS)
        .from(courses)
        .leftJoin(images, eq(courses.imageId, images.imageId))
        .leftJoin(videos, eq(courses.videoId, videos.videoId))
        .where(eq(courses.courseId, courseId));

      if (courseResult.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }

      const instructorsResult = await db
        .select(courseService.INSTRUCTOR_FIELDS)
        .from(instructors)
        .innerJoin(
          courseInstructors,
          eq(instructors.instructorId, courseInstructors.instructorId)
        )
        .leftJoin(images, eq(instructors.imageId, images.imageId))
        .where(eq(courseInstructors.courseId, courseId));

      const course = courseResult[0];
      course.instructors = instructorsResult;

      res.json({ success: true, data: course });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/courses/:courseId/sections - Get sections for a course
   */
  async getCourseSections(req, res, next) {
    try {
      const { courseId } = req.params;

      const courseCheck = await db
        .select({ count: count() })
        .from(courses)
        .where(eq(courses.courseId, courseId));

      if (Number(courseCheck?.[0]?.count || 0) === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }

      const result = await db
        .select({
          section_id: sections.sectionId,
          course_id: sections.courseId,
          title: sections.title,
          description: sections.description,
          image_id: sections.imageId,
          video_id: sections.videoId,
          section_image: images.imageUrl,
          video_title: videos.title,
        })
        .from(sections)
        .leftJoin(images, eq(sections.imageId, images.imageId))
        .leftJoin(videos, eq(sections.videoId, videos.videoId))
        .where(eq(sections.courseId, courseId))
        .orderBy(sections.title);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/courses - Create new course
   */
  async createCourse(req, res, next) {
    try {
      const result = await db.transaction(async (tx) => {
        const {
          course_name,
          description,
          image_id,
          image_url,
          alt_text,
          video_id,
          instructor_ids,
        } = req.body;

        if (!course_name?.trim()) {
          throw new Error("Course name is required");
        }

        // Use mediaManager for image handling
        const schema = { images, videos };
        const finalImageId = await mediaManager.handleImage(
          tx, 
          { image_id, image_url, alt_text },
          schema
        );

        const [course] = await tx
          .insert(courses)
          .values({
            courseName: course_name.trim(),
            description: description || null,
            imageId: finalImageId,
            videoId: video_id || null,
          })
          .returning();

        // Use courseService for instructor linking
        if (instructor_ids?.length > 0) {
          await courseService.linkInstructors(
            tx,
            course.courseId,
            instructor_ids
          );
        }

        return course;
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      const status =
        error.status ||
        (error.message === "Course name is required" ? 400 : 500);
      if (status !== 500) {
        return res
          .status(status)
          .json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  /**
   * PUT /api/courses/:courseId - Update course
   */
  async updateCourse(req, res, next) {
    try {
      const result = await db.transaction(async (tx) => {
        const { courseId } = req.params;
        const {
          course_name,
          description,
          image_id,
          image_url,
          alt_text,
          video_id,
          instructor_ids,
        } = req.body;

        const existing = await tx
          .select()
          .from(courses)
          .where(eq(courses.courseId, courseId));
        if (existing.length === 0) {
          throw new Error("Course not found");
        }

        // Use mediaManager for image handling
        const schema = { images, videos };
        const currentImageId = await mediaManager.updateImage(
          tx,
          existing[0].imageId,
          { image_id, image_url, alt_text },
          schema
        );

        const updateFields = { updatedAt: new Date() };
        if (course_name !== undefined) updateFields.courseName = course_name;
        if (description !== undefined) updateFields.description = description;
        if (video_id !== undefined) updateFields.videoId = video_id;
        if (currentImageId !== undefined) updateFields.imageId = currentImageId;

        const [updated] = await tx
          .update(courses)
          .set(updateFields)
          .where(eq(courses.courseId, courseId))
          .returning();

        // Use courseService for instructor relationships
        if (instructor_ids !== undefined) {
          await courseService.updateInstructors(tx, courseId, instructor_ids);
        }

        return updated;
      });

      res.json({ success: true, data: result });
    } catch (error) {
      const status =
        error.status || (error.message.includes("not found") ? 404 : 500);
      if (status !== 500) {
        return res
          .status(status)
          .json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  /**
   * POST /api/courses/:courseId/archive - Archive course indefinitely
   */
  async archiveCourse(req, res, next) {
    try {
      const { courseId } = req.params;

      const existing = await db
        .select()
        .from(courses)
        .where(eq(courses.courseId, courseId));
      if (existing.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }

      const [updated] = await db
        .update(courses)
        .set({
          isArchived: true,
          archivedAt: new Date(),
          purgeAfterAt: null,
          updatedAt: new Date(),
        })
        .where(eq(courses.courseId, courseId))
        .returning();

      res.json({ success: true, data: updated, message: "Course archived" });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/courses/:courseId/restore - Restore archived course
   */
  async restoreCourse(req, res, next) {
    try {
      const { courseId } = req.params;

      const existing = await db
        .select()
        .from(courses)
        .where(eq(courses.courseId, courseId));
      if (existing.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }

      const [updated] = await db
        .update(courses)
        .set({
          isArchived: false,
          archivedAt: null,
          purgeAfterAt: null,
          updatedAt: new Date(),
        })
        .where(eq(courses.courseId, courseId))
        .returning();

      res.json({ success: true, data: updated, message: "Course restored" });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/courses/:courseId - Delete course with automatic cascade
   */
  async deleteCourse(req, res, next) {
    try {
      const result = await db.transaction(async (tx) => {
        const { courseId } = req.params;

        // Check course exists
        const existing = await tx
          .select()
          .from(courses)
          .where(eq(courses.courseId, courseId));
        if (existing.length === 0) {
          throw new Error("Course not found");
        }

        // Check for sections
        const sectionsCheck = await tx
          .select({ count: count() })
          .from(sections)
          .where(eq(sections.courseId, courseId));

        if (Number(sectionsCheck?.[0]?.count || 0) > 0) {
          throw new Error(
            "Cannot delete course with existing sections. Delete sections first."
          );
        }

        const course = existing[0];
        const schema = {
          courses,
          images,
          videos,
          sections,
          chapters,
          tests,
          instructors,
          options,
          entries,
          optionVideos,
          questionVideos,
        };

        // Use mediaManager for deletion with cascade
        const cascadedMedia = await mediaManager.deleteWithCascade(
          tx,
          course,
          courses,
          courses.courseId,
          courseId,
          schema,
          TimeUntilDeletion
        );

        return cascadedMedia;
      });

      let message = "Course scheduled for deletion in 60 seconds.";
      const cascaded = [];
      if (result.image) cascaded.push("image");
      if (result.video) cascaded.push("video");

      if (cascaded.length > 0) {
        message = `Course and its exclusive ${cascaded.join(
          " and "
        )} scheduled for deletion in 60 seconds.`;
      }

      res.json({
        success: true,
        message,
        cascadedMedia: result,
      });
    } catch (error) {
      const status =
        error.status ||
        (error.message.includes("not found")
          ? 404
          : error.message.includes("Cannot delete")
          ? 400
          : 500);
      if (status !== 500) {
        return res
          .status(status)
          .json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = courseController;