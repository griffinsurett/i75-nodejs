// ==================== controllers/testController.js ====================
const { db } = require("../../config/database");
const { 
  tests, 
  chapters, 
  sections, 
  courses, 
  images, 
  videos, 
  questions, 
  entries 
} = require("../../config/schema");
const { eq, count } = require("drizzle-orm");

const testController = {
  // Get all tests
  getAllTests: async (req, res, next) => {
    try {
      const result = await db
        .select({
          test_id: tests.testId,
          chapter_id: tests.chapterId,
          title: tests.title,
          description: tests.description,
          image_id: tests.imageId,
          video_id: tests.videoId,
          chapter_title: chapters.title,
          section_title: sections.title,
          course_name: courses.courseName,
          test_image: images.imageUrl,
          video_title: videos.title,
        })
        .from(tests)
        .innerJoin(chapters, eq(tests.chapterId, chapters.chapterId))
        .innerJoin(sections, eq(chapters.sectionId, sections.sectionId))
        .innerJoin(courses, eq(sections.courseId, courses.courseId))
        .leftJoin(images, eq(tests.imageId, images.imageId))
        .leftJoin(videos, eq(tests.videoId, videos.videoId))
        .orderBy(courses.courseName, sections.title, chapters.chapterNumber, tests.title);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get tests by chapter
  getTestsByChapter: async (req, res, next) => {
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

  // Get single test with questions
  getTestById: async (req, res, next) => {
    try {
      const { testId } = req.params;

      // Get test details
      const testResult = await db
        .select({
          test_id: tests.testId,
          chapter_id: tests.chapterId,
          title: tests.title,
          description: tests.description,
          image_id: tests.imageId,
          video_id: tests.videoId,
          chapter_title: chapters.title,
          section_title: sections.title,
          course_name: courses.courseName,
          test_image: images.imageUrl,
          video_title: videos.title,
        })
        .from(tests)
        .innerJoin(chapters, eq(tests.chapterId, chapters.chapterId))
        .innerJoin(sections, eq(chapters.sectionId, sections.sectionId))
        .innerJoin(courses, eq(sections.courseId, courses.courseId))
        .leftJoin(images, eq(tests.imageId, images.imageId))
        .leftJoin(videos, eq(tests.videoId, videos.videoId))
        .where(eq(tests.testId, testId));

      if (testResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Test not found",
        });
      }

      // Get questions for this test
      const questionsResult = await db
        .select({
          question_id: questions.questionId,
          test_id: questions.testId,
          question_text: questions.questionText,
        })
        .from(questions)
        .where(eq(questions.testId, testId))
        .orderBy(questions.questionId);

      const test = testResult[0];
      test.questions = questionsResult;

      res.json({
        success: true,
        data: test,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get questions for a test
  getTestQuestions: async (req, res, next) => {
    try {
      const { testId } = req.params;

      // Check if test exists
      const testCheck = await db
        .select({ count: count() })
        .from(tests)
        .where(eq(tests.testId, testId));

      if (testCheck[0].count === 0) {
        return res.status(404).json({
          success: false,
          message: "Test not found",
        });
      }

      const result = await db
        .select({
          question_id: questions.questionId,
          test_id: questions.testId,
          question_text: questions.questionText,
        })
        .from(questions)
        .where(eq(questions.testId, testId))
        .orderBy(questions.questionId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Create test
  createTest: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { chapter_id, title, description, image_url, alt_text, video_id } = req.body;

        if (!chapter_id || !title) {
          throw new Error("Chapter ID and title are required");
        }

        // Check if chapter exists
        const chapterCheck = await tx
          .select({ count: count() })
          .from(chapters)
          .where(eq(chapters.chapterId, chapter_id));

        if (chapterCheck[0].count === 0) {
          throw new Error("Chapter not found");
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

        const testResult = await tx
          .insert(tests)
          .values({
            chapterId: chapter_id,
            title,
            description,
            imageId: image_id,
            videoId: video_id,
          })
          .returning();

        return testResult[0];
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message === "Chapter ID and title are required" ||
          error.message === "Chapter not found") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },

  // Update test
  updateTest: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { testId } = req.params;
        const { title, description, image_url, alt_text, video_id } = req.body;

        // Check if test exists
        const existingTest = await tx
          .select()
          .from(tests)
          .where(eq(tests.testId, testId));

        if (existingTest.length === 0) {
          throw new Error("Test not found");
        }

        // Handle image update
        let image_id = existingTest[0].imageId;
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
          .update(tests)
          .set({
            title,
            description,
            imageId: image_id,
            videoId: video_id,
          })
          .where(eq(tests.testId, testId))
          .returning();

        return updateResult[0];
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message === "Test not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },

  // Delete test
  deleteTest: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { testId } = req.params;

        // Check if test has questions
        const questionsCheck = await tx
          .select({ count: count() })
          .from(questions)
          .where(eq(questions.testId, testId));

        if (questionsCheck[0].count > 0) {
          throw new Error("Cannot delete test with existing questions. Delete questions first.");
        }

        // Check if test is used in entries
        const entriesCheck = await tx
          .select({ count: count() })
          .from(entries)
          .where(eq(entries.testId, testId));

        if (entriesCheck[0].count > 0) {
          throw new Error("Cannot delete test that is used in chapter entries. Remove from entries first.");
        }

        const deleteResult = await tx
          .delete(tests)
          .where(eq(tests.testId, testId))
          .returning();

        if (deleteResult.length === 0) {
          throw new Error("Test not found");
        }

        return deleteResult[0];
      });

      res.json({
        success: true,
        message: "Test deleted successfully",
      });
    } catch (error) {
      if (error.message === "Test not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message.includes("Cannot delete test")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },
};

module.exports = testController;