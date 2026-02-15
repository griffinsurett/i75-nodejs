// backend/domains/test/test.controller.js
const { db } = require("../../config/database");
const {
  tests,
  chapters,
  sections,
  courses,
  images,
  videos,
  questions,
  entries,
} = require("../../config/schema");
const { eq } = require("drizzle-orm");
const mediaManager = require("../../shared/utils/mediaManager");
const BaseController = require("../../shared/utils/baseController");

const TimeUntilDeletion = 60000;

class TestController extends BaseController {
  get mediaSchema() {
    return { tests, chapters, sections, courses, images, videos };
  }

  /**
   * GET /api/tests - Get all tests with optional archive filter
   */
  async getAllTests(req, res, next) {
    try {
      const showArchived = String(req.query.archived || "").toLowerCase() === "true";

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
        .where(eq(tests.isArchived, showArchived))
        .orderBy(courses.courseName, sections.title, chapters.chapterNumber, tests.title);

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/tests/:testId - Get single test with questions
   */
  async getTestById(req, res, next) {
    try {
      const { testId } = req.params;

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
        this.throwNotFound("Test");
      }

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

      this.success(res, test);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/tests/:testId/questions - Get questions for a test
   */
  async getTestQuestions(req, res, next) {
    try {
      const { testId } = req.params;

      const testExists = await this.checkRelatedCount(db, tests, tests.testId, testId);
      if (testExists === 0) {
        this.throwNotFound("Test");
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

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/tests - Create test
   */
  async createTest(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const { chapter_id, title, description, image_url, alt_text, video_id } = req.body;

        const validatedTitle = this.validateRequired(title, "Title");

        if (!chapter_id) {
          throw this.createError("Chapter ID is required", 400);
        }

        await this.getOrThrow(tx, chapters, chapters.chapterId, chapter_id, "Chapter");

        let image_id = null;
        if (image_url) {
          const [imgRow] = await tx
            .insert(images)
            .values({
              imageUrl: image_url,
              altText: alt_text || null,
              isArchived: false,
              createdAt: new Date(),
            })
            .returning({ imageId: images.imageId });
          image_id = imgRow.imageId;
        }

        const [test] = await tx
          .insert(tests)
          .values({
            chapterId: chapter_id,
            title: validatedTitle,
            description: description || null,
            imageId: image_id,
            videoId: video_id || null,
            isArchived: false,
            createdAt: new Date(),
          })
          .returning();

        return test;
      });

      this.success(res, result, null, 201);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * PUT /api/tests/:testId - Update test
   */
  async updateTest(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const { testId } = req.params;
        const { title, description, image_url, alt_text, video_id } = req.body;

        const existing = await this.getOrThrow(tx, tests, tests.testId, testId, "Test");

        let image_id = existing.imageId;
        if (image_url) {
          if (image_id) {
            await tx
              .update(images)
              .set({ imageUrl: image_url, altText: alt_text || null, updatedAt: new Date() })
              .where(eq(images.imageId, image_id));
          } else {
            const [imgRow] = await tx
              .insert(images)
              .values({
                imageUrl: image_url,
                altText: alt_text || null,
                isArchived: false,
                createdAt: new Date(),
              })
              .returning({ imageId: images.imageId });
            image_id = imgRow.imageId;
          }
        }

        const updateFields = { updatedAt: new Date() };
        if (title !== undefined) updateFields.title = title;
        if (description !== undefined) updateFields.description = description;
        if (image_id !== undefined) updateFields.imageId = image_id;
        if (video_id !== undefined) updateFields.videoId = video_id;

        const [updated] = await tx
          .update(tests)
          .set(updateFields)
          .where(eq(tests.testId, testId))
          .returning();

        return updated;
      });

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/tests/:testId/archive - Archive test indefinitely
   */
  async archiveTest(req, res, next) {
    try {
      const { testId } = req.params;
      const updated = await this.archive(db, tests, tests.testId, testId, "Test");
      this.success(res, updated, "Test archived");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/tests/:testId/restore - Restore archived test
   */
  async restoreTest(req, res, next) {
    try {
      const { testId } = req.params;
      const updated = await this.restore(db, tests, tests.testId, testId, "Test");
      this.success(res, updated, "Test restored");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * DELETE /api/tests/:testId - Soft delete with countdown
   */
  async deleteTest(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const { testId } = req.params;

        const test = await this.getOrThrow(tx, tests, tests.testId, testId, "Test");

        const questionCount = await this.checkRelatedCount(tx, questions, questions.testId, testId);
        if (questionCount > 0) {
          throw this.createError("Cannot delete test with existing questions. Delete questions first.", 400);
        }

        const entryCount = await this.checkRelatedCount(tx, entries, entries.testId, testId);
        if (entryCount > 0) {
          throw this.createError("Cannot delete test that is used in chapter entries. Remove from entries first.", 400);
        }

        return await mediaManager.deleteWithCascade(
          tx,
          test,
          tests,
          tests.testId,
          testId,
          this.mediaSchema,
          TimeUntilDeletion
        );
      });

      let message = "Test scheduled for deletion in 60 seconds.";
      const cascaded = [];
      if (result.image) cascaded.push("image");
      if (result.video) cascaded.push("video");
      if (cascaded.length > 0) {
        message = `Test and its exclusive ${cascaded.join(" and ")} scheduled for deletion in 60 seconds.`;
      }

      this.success(res, result, message);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }
}

module.exports = new TestController();
