// ==================== controllers/chapterController.js ====================
const { db } = require("../../config/database");
const { 
  chapters, 
  sections, 
  courses, 
  images, 
  tests, 
  entries, 
  videos 
} = require("../../config/schema");
const { eq, count } = require("drizzle-orm");

const chapterController = {
  // Get all chapters
  getAllChapters: async (req, res, next) => {
    try {
      const result = await db
        .select({
          chapter_id: chapters.chapterId,
          section_id: chapters.sectionId,
          chapter_number: chapters.chapterNumber,
          title: chapters.title,
          description: chapters.description,
          image_id: chapters.imageId,
          section_title: sections.title,
          course_name: courses.courseName,
          chapter_image: images.imageUrl,
        })
        .from(chapters)
        .innerJoin(sections, eq(chapters.sectionId, sections.sectionId))
        .innerJoin(courses, eq(sections.courseId, courses.courseId))
        .leftJoin(images, eq(chapters.imageId, images.imageId))
        .orderBy(courses.courseName, sections.title, chapters.chapterNumber);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get chapters by section
  getChaptersBySection: async (req, res, next) => {
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

  // Get single chapter
  getChapterById: async (req, res, next) => {
    try {
      const { chapterId } = req.params;

      const result = await db
        .select({
          chapter_id: chapters.chapterId,
          section_id: chapters.sectionId,
          chapter_number: chapters.chapterNumber,
          title: chapters.title,
          description: chapters.description,
          image_id: chapters.imageId,
          section_title: sections.title,
          course_name: courses.courseName,
          chapter_image: images.imageUrl,
        })
        .from(chapters)
        .innerJoin(sections, eq(chapters.sectionId, sections.sectionId))
        .innerJoin(courses, eq(sections.courseId, courses.courseId))
        .leftJoin(images, eq(chapters.imageId, images.imageId))
        .where(eq(chapters.chapterId, chapterId));

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Chapter not found",
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

  // Get tests for a chapter
  getChapterTests: async (req, res, next) => {
    try {
      const { chapterId } = req.params;

      // Check if chapter exists
      const chapterCheck = await db
        .select({ count: count() })
        .from(chapters)
        .where(eq(chapters.chapterId, chapterId));

      if (chapterCheck[0].count === 0) {
        return res.status(404).json({
          success: false,
          message: "Chapter not found",
        });
      }

      const result = await db
        .select({
          test_id: tests.testId,
          chapter_id: tests.chapterId,
          title: tests.title,
          description: tests.description,
          image_id: tests.imageId,
          video_id: tests.videoId,
          test_image: images.imageUrl,
          video_title: videos.title,
        })
        .from(tests)
        .leftJoin(images, eq(tests.imageId, images.imageId))
        .leftJoin(videos, eq(tests.videoId, videos.videoId))
        .where(eq(tests.chapterId, chapterId))
        .orderBy(tests.title);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get entries for a chapter
  getChapterEntries: async (req, res, next) => {
    try {
      const { chapterId } = req.params;

      // Check if chapter exists
      const chapterCheck = await db
        .select({ count: count() })
        .from(chapters)
        .where(eq(chapters.chapterId, chapterId));

      if (chapterCheck[0].count === 0) {
        return res.status(404).json({
          success: false,
          message: "Chapter not found",
        });
      }

      const result = await db
        .select({
          entry_id: entries.entryId,
          chapter_id: entries.chapterId,
          sequence_number: entries.sequenceNumber,
          test_id: entries.testId,
          video_id: entries.videoId,
          test_title: tests.title,
          video_title: videos.title,
        })
        .from(entries)
        .leftJoin(tests, eq(entries.testId, tests.testId))
        .leftJoin(videos, eq(entries.videoId, videos.videoId))
        .where(eq(entries.chapterId, chapterId))
        .orderBy(entries.sequenceNumber);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Create chapter
  createChapter: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const {
          section_id,
          chapter_number,
          title,
          description,
          image_url,
          alt_text,
        } = req.body;

        if (!section_id || !chapter_number || !title) {
          throw new Error("Section ID, chapter number, and title are required");
        }

        // Check if section exists
        const sectionCheck = await tx
          .select({ count: count() })
          .from(sections)
          .where(eq(sections.sectionId, section_id));

        if (sectionCheck[0].count === 0) {
          throw new Error("Section not found");
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

        const chapterResult = await tx
          .insert(chapters)
          .values({
            sectionId: section_id,
            chapterNumber: chapter_number,
            title,
            description,
            imageId: image_id,
          })
          .returning();

        return chapterResult[0];
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message === "Section ID, chapter number, and title are required" || 
          error.message === "Section not found") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },

  // Update chapter
  updateChapter: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { chapterId } = req.params;
        const { chapter_number, title, description, image_url, alt_text } = req.body;

        // Check if chapter exists
        const existingChapter = await tx
          .select()
          .from(chapters)
          .where(eq(chapters.chapterId, chapterId));

        if (existingChapter.length === 0) {
          throw new Error("Chapter not found");
        }

        // Handle image update
        let image_id = existingChapter[0].imageId;
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
          .update(chapters)
          .set({
            chapterNumber: chapter_number,
            title,
            description,
            imageId: image_id,
          })
          .where(eq(chapters.chapterId, chapterId))
          .returning();

        return updateResult[0];
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message === "Chapter not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },

  // Delete chapter
  deleteChapter: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { chapterId } = req.params;

        // Check if chapter has tests or entries
        const testsCheck = await tx
          .select({ count: count() })
          .from(tests)
          .where(eq(tests.chapterId, chapterId));

        const entriesCheck = await tx
          .select({ count: count() })
          .from(entries)
          .where(eq(entries.chapterId, chapterId));

        if (testsCheck[0].count > 0 || entriesCheck[0].count > 0) {
          throw new Error("Cannot delete chapter with existing tests or entries. Delete them first.");
        }

        const deleteResult = await tx
          .delete(chapters)
          .where(eq(chapters.chapterId, chapterId))
          .returning();

        if (deleteResult.length === 0) {
          throw new Error("Chapter not found");
        }

        return deleteResult[0];
      });

      res.json({
        success: true,
        message: "Chapter deleted successfully",
      });
    } catch (error) {
      if (error.message === "Chapter not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message.includes("Cannot delete chapter")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },
};

module.exports = chapterController;