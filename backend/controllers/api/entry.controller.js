// ==================== controllers/entryController.js ====================
const { db } = require("../../config/database");
const { 
  entries, 
  chapters, 
  sections, 
  courses, 
  tests, 
  videos 
} = require("../../config/schema");
const { eq, count } = require("drizzle-orm");

const entryController = {
  // Get all entries
  getAllEntries: async (req, res, next) => {
    try {
      const result = await db
        .select({
          entry_id: entries.entryId,
          chapter_id: entries.chapterId,
          sequence_number: entries.sequenceNumber,
          test_id: entries.testId,
          video_id: entries.videoId,
          chapter_title: chapters.title,
          section_title: sections.title,
          course_name: courses.courseName,
          test_title: tests.title,
          video_title: videos.title,
        })
        .from(entries)
        .innerJoin(chapters, eq(entries.chapterId, chapters.chapterId))
        .innerJoin(sections, eq(chapters.sectionId, sections.sectionId))
        .innerJoin(courses, eq(sections.courseId, courses.courseId))
        .leftJoin(tests, eq(entries.testId, tests.testId))
        .leftJoin(videos, eq(entries.videoId, videos.videoId))
        .orderBy(courses.courseName, sections.title, chapters.chapterNumber, entries.sequenceNumber);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get entries by chapter
  getEntriesByChapter: async (req, res, next) => {
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

  // Get single entry
  getEntryById: async (req, res, next) => {
    try {
      const { entryId } = req.params;

      const result = await db
        .select({
          entry_id: entries.entryId,
          chapter_id: entries.chapterId,
          sequence_number: entries.sequenceNumber,
          test_id: entries.testId,
          video_id: entries.videoId,
          chapter_title: chapters.title,
          section_title: sections.title,
          course_name: courses.courseName,
          test_title: tests.title,
          video_title: videos.title,
        })
        .from(entries)
        .innerJoin(chapters, eq(entries.chapterId, chapters.chapterId))
        .innerJoin(sections, eq(chapters.sectionId, sections.sectionId))
        .innerJoin(courses, eq(sections.courseId, courses.courseId))
        .leftJoin(tests, eq(entries.testId, tests.testId))
        .leftJoin(videos, eq(entries.videoId, videos.videoId))
        .where(eq(entries.entryId, entryId));

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Entry not found",
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

  // Create entry
  createEntry: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { chapter_id, sequence_number, test_id, video_id } = req.body;

        if (!chapter_id || sequence_number === undefined) {
          throw new Error("Chapter ID and sequence number are required");
        }

        // Must have either test_id or video_id, not both or neither
        if ((!test_id && !video_id) || (test_id && video_id)) {
          throw new Error("Entry must have either a test_id or video_id, but not both");
        }

        // Check if chapter exists
        const chapterCheck = await tx
          .select({ count: count() })
          .from(chapters)
          .where(eq(chapters.chapterId, chapter_id));

        if (chapterCheck[0].count === 0) {
          throw new Error("Chapter not found");
        }

        // Check if test exists (if provided)
        if (test_id) {
          const testCheck = await tx
            .select({ count: count() })
            .from(tests)
            .where(eq(tests.testId, test_id));

          if (testCheck[0].count === 0) {
            throw new Error("Test not found");
          }
        }

        // Check if video exists (if provided)
        if (video_id) {
          const videoCheck = await tx
            .select({ count: count() })
            .from(videos)
            .where(eq(videos.videoId, video_id));

          if (videoCheck[0].count === 0) {
            throw new Error("Video not found");
          }
        }

        const entryResult = await tx
          .insert(entries)
          .values({
            chapterId: chapter_id,
            sequenceNumber: sequence_number,
            testId: test_id,
            videoId: video_id,
          })
          .returning();

        return entryResult[0];
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message.includes("required") || 
          error.message.includes("not found") ||
          error.message.includes("must have either")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },

  // Update entry
  updateEntry: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { entryId } = req.params;
        const { sequence_number, test_id, video_id } = req.body;

        // Check if entry exists
        const existingEntry = await tx
          .select()
          .from(entries)
          .where(eq(entries.entryId, entryId));

        if (existingEntry.length === 0) {
          throw new Error("Entry not found");
        }

        // Must have either test_id or video_id, not both or neither
        if ((!test_id && !video_id) || (test_id && video_id)) {
          throw new Error("Entry must have either a test_id or video_id, but not both");
        }

        // Check if test exists (if provided)
        if (test_id) {
          const testCheck = await tx
            .select({ count: count() })
            .from(tests)
            .where(eq(tests.testId, test_id));

          if (testCheck[0].count === 0) {
            throw new Error("Test not found");
          }
        }

        // Check if video exists (if provided)
        if (video_id) {
          const videoCheck = await tx
            .select({ count: count() })
            .from(videos)
            .where(eq(videos.videoId, video_id));

          if (videoCheck[0].count === 0) {
            throw new Error("Video not found");
          }
        }

        const updateResult = await tx
          .update(entries)
          .set({
            sequenceNumber: sequence_number,
            testId: test_id,
            videoId: video_id,
          })
          .where(eq(entries.entryId, entryId))
          .returning();

        return updateResult[0];
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message === "Entry not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message.includes("not found") || 
          error.message.includes("must have either")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },

  // Delete entry
  deleteEntry: async (req, res, next) => {
    try {
      const { entryId } = req.params;

      const deleteResult = await db
        .delete(entries)
        .where(eq(entries.entryId, entryId))
        .returning();

      if (deleteResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Entry not found",
        });
      }

      res.json({
        success: true,
        message: "Entry deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = entryController;