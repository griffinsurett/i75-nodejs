// ==================== controllers/api/courseController.js (UPDATED with Archive) ====================
const { db } = require("../../config/database");
const {
  courses,
  images,
  videos,
  instructors,
  courseInstructors,
  sections,
} = require("../../config/schema");
const { eq, desc, count } = require("drizzle-orm");

const ONE_MINUTE_MS = 60 * 1000;

const courseController = {
  // Get all active (non-archived) courses with basic info
 // Get all courses with basic info (supports ?archived=true)
getAllCourses: async (req, res, next) => {
  try {
    const showArchived =
      String(req.query.archived || "").toLowerCase() === "true";

    const result = await db
      .select({
        course_id: courses.courseId,
        course_name: courses.courseName,
        description: courses.description,
        created_at: courses.createdAt,
        updated_at: courses.updatedAt,
        // include archive fields so the UI can badge + decide actions
        is_archived: courses.isArchived,
        archived_at: courses.archivedAt,
        course_image: images.imageUrl,
        video_title: videos.title,
      })
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

  // Get single course with instructors (returns even if archived)
  getCourseById: async (req, res, next) => {
    try {
      const { courseId } = req.params;

      const courseResult = await db
        .select({
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
        })
        .from(courses)
        .leftJoin(images, eq(courses.imageId, images.imageId))
        .leftJoin(videos, eq(courses.videoId, videos.videoId))
        .where(eq(courses.courseId, courseId));

      if (courseResult.length === 0) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }

      const instructorsResult = await db
        .select({
          instructor_id: instructors.instructorId,
          name: instructors.name,
          bio: instructors.bio,
          instructor_image: images.imageUrl,
        })
        .from(instructors)
        .innerJoin(courseInstructors, eq(instructors.instructorId, courseInstructors.instructorId))
        .leftJoin(images, eq(instructors.imageId, images.imageId))
        .where(eq(courseInstructors.courseId, courseId));

      const course = courseResult[0];
      course.instructors = instructorsResult;

      res.json({ success: true, data: course });
    } catch (error) {
      next(error);
    }
  },

  // Get sections for a course
  getCourseSections: async (req, res, next) => {
    try {
      const { courseId } = req.params;

      const courseCheck = await db
        .select({ count: count() })
        .from(courses)
        .where(eq(courses.courseId, courseId));

      if (Number(courseCheck?.[0]?.count || 0) === 0) {
        return res.status(404).json({ success: false, message: "Course not found" });
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

  // Create new course (supports image_id OR image_url OR neither)
  createCourse: async (req, res, next) => {
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

        if (!course_name || !course_name.trim()) {
          const err = new Error("Course name is required");
          err.status = 400;
          throw err;
        }

        let finalImageId = null;

        if (image_id) {
          const imgCheck = await tx
            .select({ count: count() })
            .from(images)
            .where(eq(images.imageId, image_id));
          if (Number(imgCheck?.[0]?.count || 0) === 0) {
            const err = new Error("Provided image_id does not exist");
            err.status = 400;
            throw err;
          }
          finalImageId = image_id;
        } else if (image_url) {
          const [imgRow] = await tx
            .insert(images)
            .values({ imageUrl: image_url, altText: alt_text || null })
            .returning({ imageId: images.imageId });
          finalImageId = imgRow.imageId;
        }

        const [course] = await tx
          .insert(courses)
          .values({
            courseName: course_name.trim(),
            description: description || null,
            imageId: finalImageId,
            videoId: video_id || null,
          })
          .returning();

        if (Array.isArray(instructor_ids) && instructor_ids.length > 0) {
          await tx.insert(courseInstructors).values(
            instructor_ids.map((iid) => ({
              courseId: course.courseId,
              instructorId: iid,
            }))
          );
        }

        return course;
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      const status = error.status || (error.message === "Course name is required" ? 400 : 500);
      if (status !== 500) {
        return res.status(status).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  // Update course (supports switching to image_id, or setting a new image_url)
  updateCourse: async (req, res, next) => {
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

        const existing = await tx.select().from(courses).where(eq(courses.courseId, courseId));
        if (existing.length === 0) {
          const err = new Error("Course not found");
          err.status = 404;
          throw err;
        }

        let currentImageId = existing[0].imageId;

        if (image_id !== undefined) {
          if (image_id === null) {
            currentImageId = null;
          } else {
            const imgCheck = await tx
              .select({ count: count() })
              .from(images)
              .where(eq(images.imageId, image_id));
            if (Number(imgCheck?.[0]?.count || 0) === 0) {
              const err = new Error("Provided image_id does not exist");
              err.status = 400;
              throw err;
            }
            currentImageId = image_id;
          }
        } else if (image_url !== undefined && image_url !== null && image_url !== "") {
          if (currentImageId) {
            await tx
              .update(images)
              .set({ imageUrl: image_url, altText: alt_text || null })
              .where(eq(images.imageId, currentImageId));
          } else {
            const [imgRow] = await tx
              .insert(images)
              .values({ imageUrl: image_url, altText: alt_text || null })
              .returning({ imageId: images.imageId });
            currentImageId = imgRow.imageId;
          }
        }

        const updateFields = {
          updatedAt: new Date(),
        };
        if (course_name !== undefined) updateFields.courseName = course_name;
        if (description !== undefined) updateFields.description = description;
        if (video_id !== undefined) updateFields.videoId = video_id;
        if (currentImageId !== undefined) updateFields.imageId = currentImageId;

        const [updated] = await tx
          .update(courses)
          .set(updateFields)
          .where(eq(courses.courseId, courseId))
          .returning();

        if (instructor_ids !== undefined) {
          await tx.delete(courseInstructors).where(eq(courseInstructors.courseId, courseId));
          if (Array.isArray(instructor_ids) && instructor_ids.length > 0) {
            await tx.insert(courseInstructors).values(
              instructor_ids.map((iid) => ({
                courseId,
                instructorId: iid,
              }))
            );
          }
        }

        return updated;
      });

      res.json({ success: true, data: result });
    } catch (error) {
      const status = error.status || (error.message === "Course not found" ? 404 : 500);
      if (status !== 500) {
        return res.status(status).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  // Archive indefinitely (no scheduled deletion)
  archiveCourse: async (req, res, next) => {
    try {
      const { courseId } = req.params;

      const existing = await db.select().from(courses).where(eq(courses.courseId, courseId));
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }

      const [updated] = await db
        .update(courses)
        .set({
          isArchived: true,
          archivedAt: new Date(),
          purgeAfterAt: null, // <- indefinite
          updatedAt: new Date(),
        })
        .where(eq(courses.courseId, courseId))
        .returning();

      res.json({ success: true, data: updated, message: "Course archived" });
    } catch (error) {
      next(error);
    }
  },

  // Restore (also cancels any pending purge)
  restoreCourse: async (req, res, next) => {
    try {
      const { courseId } = req.params;

      const existing = await db.select().from(courses).where(eq(courses.courseId, courseId));
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: "Course not found" });
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
   * "Delete" = schedule permanent deletion in 60s.
   * We still prevent scheduling if the course has sections,
   * keeping the same safety guard you already had.
   */
  deleteCourse: async (req, res, next) => {
    try {
      await db.transaction(async (tx) => {
        const { courseId } = req.params;

        // Must exist
        const existing = await tx.select().from(courses).where(eq(courses.courseId, courseId));
        if (existing.length === 0) {
          const err = new Error("Course not found");
          err.status = 404;
          throw err;
        }

        // Keep the original guard
        const sectionsCheck = await tx
          .select({ count: count() })
          .from(sections)
          .where(eq(sections.courseId, courseId));

        if (Number(sectionsCheck?.[0]?.count || 0) > 0) {
          const err = new Error("Cannot delete course with existing sections. Delete sections first.");
          err.status = 400;
          throw err;
        }

        // Schedule purge (archive now + purge in 60s)
        const now = Date.now();
        const purgeAt = new Date(now + ONE_MINUTE_MS);

        await tx
          .update(courses)
          .set({
            isArchived: true,
            archivedAt: new Date(now),
            purgeAfterAt: purgeAt,
            updatedAt: new Date(now),
          })
          .where(eq(courses.courseId, courseId))
          .returning();
      });

      res.json({
        success: true,
        message: "Course scheduled for deletion in 60 seconds (archived now). Restore within a minute to cancel.",
      });
    } catch (error) {
      const status = error.status || (error.message === "Course not found" ? 404 : 500);
      if (status !== 500) {
        return res.status(status).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = courseController;
