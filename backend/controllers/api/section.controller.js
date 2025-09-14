// ==================== controllers/sectionController.js ====================
const { db } = require("../../config/database");
const { 
  sections, 
  courses, 
  images, 
  videos, 
  chapters 
} = require("../../config/schema");
const { eq, count } = require("drizzle-orm");

const sectionController = {
  // Get all sections
  getAllSections: async (req, res, next) => {
    try {
      const result = await db
        .select({
          section_id: sections.sectionId,
          course_id: sections.courseId,
          title: sections.title,
          description: sections.description,
          image_id: sections.imageId,
          video_id: sections.videoId,
          course_name: courses.courseName,
          section_image: images.imageUrl,
          video_title: videos.title,
        })
        .from(sections)
        .innerJoin(courses, eq(sections.courseId, courses.courseId))
        .leftJoin(images, eq(sections.imageId, images.imageId))
        .leftJoin(videos, eq(sections.videoId, videos.videoId))
        .orderBy(courses.courseName, sections.title);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get sections by course
  getSectionsByCourse: async (req, res, next) => {
    try {
      const { courseId } = req.params;

      // Check if course exists
      const courseCheck = await db
        .select({ count: count() })
        .from(courses)
        .where(eq(courses.courseId, courseId));

      if (courseCheck[0].count === 0) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
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

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single section
  getSectionById: async (req, res, next) => {
    try {
      const { sectionId } = req.params;

      const result = await db
        .select({
          section_id: sections.sectionId,
          course_id: sections.courseId,
          title: sections.title,
          description: sections.description,
          image_id: sections.imageId,
          video_id: sections.videoId,
          course_name: courses.courseName,
          section_image: images.imageUrl,
          video_title: videos.title,
        })
        .from(sections)
        .innerJoin(courses, eq(sections.courseId, courses.courseId))
        .leftJoin(images, eq(sections.imageId, images.imageId))
        .leftJoin(videos, eq(sections.videoId, videos.videoId))
        .where(eq(sections.sectionId, sectionId));

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Section not found",
        });
      }

      res.json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      next(error);
    }
  },

  // Get chapters for a section
  getSectionChapters: async (req, res, next) => {
    try {
      const { sectionId } = req.params;

      // Check if section exists
      const sectionCheck = await db
        .select({ count: count() })
        .from(sections)
        .where(eq(sections.sectionId, sectionId));

      if (sectionCheck[0].count === 0) {
        return res.status(404).json({
          success: false,
          message: "Section not found",
        });
      }

      const result = await db
        .select({
          chapter_id: chapters.chapterId,
          section_id: chapters.sectionId,
          chapter_number: chapters.chapterNumber,
          title: chapters.title,
          description: chapters.description,
          image_id: chapters.imageId,
          chapter_image: images.imageUrl,
        })
        .from(chapters)
        .leftJoin(images, eq(chapters.imageId, images.imageId))
        .where(eq(chapters.sectionId, sectionId))
        .orderBy(chapters.chapterNumber);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Create section
  createSection: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { course_id, title, description, image_url, alt_text, video_id } = req.body;

        if (!course_id || !title) {
          throw new Error("Course ID and title are required");
        }

        // Check if course exists
        const courseCheck = await tx
          .select({ count: count() })
          .from(courses)
          .where(eq(courses.courseId, course_id));

        if (courseCheck[0].count === 0) {
          throw new Error("Course not found");
        }

        // Handle image
        let image_id = null;
        if (image_url) {
          const imageResult = await tx
            .insert(images)
            .values({
              imageUrl: image_url,
              altText: alt_text,
            })
            .returning({ imageId: images.imageId });
          image_id = imageResult[0].imageId;
        }

        const sectionResult = await tx
          .insert(sections)
          .values({
            courseId: course_id,
            title,
            description,
            imageId: image_id,
            videoId: video_id,
          })
          .returning();

        return sectionResult[0];
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message === "Course ID and title are required" ||
          error.message === "Course not found") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },

  // Update section
  updateSection: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { sectionId } = req.params;
        const { title, description, image_url, alt_text, video_id } = req.body;

        // Check if section exists
        const existingSection = await tx
          .select()
          .from(sections)
          .where(eq(sections.sectionId, sectionId));

        if (existingSection.length === 0) {
          throw new Error("Section not found");
        }

        // Handle image update
        let image_id = existingSection[0].imageId;
        if (image_url) {
          if (image_id) {
            await tx
              .update(images)
              .set({
                imageUrl: image_url,
                altText: alt_text,
              })
              .where(eq(images.imageId, image_id));
          } else {
            const imageResult = await tx
              .insert(images)
              .values({
                imageUrl: image_url,
                altText: alt_text,
              })
              .returning({ imageId: images.imageId });
            image_id = imageResult[0].imageId;
          }
        }

        const updateResult = await tx
          .update(sections)
          .set({
            title,
            description,
            imageId: image_id,
            videoId: video_id,
          })
          .where(eq(sections.sectionId, sectionId))
          .returning();

        return updateResult[0];
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message === "Section not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },

  // Delete section
  deleteSection: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { sectionId } = req.params;

        // Check if section has chapters
        const chaptersCheck = await tx
          .select({ count: count() })
          .from(chapters)
          .where(eq(chapters.sectionId, sectionId));

        if (chaptersCheck[0].count > 0) {
          throw new Error("Cannot delete section with existing chapters. Delete chapters first.");
        }

        const deleteResult = await tx
          .delete(sections)
          .where(eq(sections.sectionId, sectionId))
          .returning();

        if (deleteResult.length === 0) {
          throw new Error("Section not found");
        }

        return deleteResult[0];
      });

      res.json({
        success: true,
        message: "Section deleted successfully",
      });
    } catch (error) {
      if (error.message === "Section not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message.includes("Cannot delete section")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },
};

module.exports = sectionController;