// backend/domains/question/question.controller.js
const { db } = require("../../config/database");
const {
  questions,
  tests,
  chapters,
  options,
  videos,
  images,
  questionImages,
  questionVideos,
} = require("../../config/schema");
const { eq } = require("drizzle-orm");
const BaseController = require("../../shared/utils/baseController");
const { archiveEntity } = require("../../shared/utils/cascadeDelete");
const { schedulePurge } = require("../../shared/workers/archivePurger");

const TimeUntilDeletion = 60000;

class QuestionController extends BaseController {
  /**
   * GET /api/questions - Get all questions with optional archive filter
   */
  async getAllQuestions(req, res, next) {
    try {
      const showArchived = String(req.query.archived || "").toLowerCase() === "true";

      const result = await db
        .select({
          question_id: questions.questionId,
          test_id: questions.testId,
          question_text: questions.questionText,
          test_title: tests.title,
          chapter_title: chapters.title,
        })
        .from(questions)
        .innerJoin(tests, eq(questions.testId, tests.testId))
        .innerJoin(chapters, eq(tests.chapterId, chapters.chapterId))
        .where(eq(questions.isArchived, showArchived))
        .orderBy(tests.title, questions.questionId);

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/questions/:questionId - Get single question with options
   */
  async getQuestionById(req, res, next) {
    try {
      const { questionId } = req.params;

      const questionResult = await db
        .select({
          question_id: questions.questionId,
          test_id: questions.testId,
          question_text: questions.questionText,
          test_title: tests.title,
        })
        .from(questions)
        .innerJoin(tests, eq(questions.testId, tests.testId))
        .where(eq(questions.questionId, questionId));

      if (questionResult.length === 0) {
        this.throwNotFound("Question");
      }

      const optionsResult = await db
        .select({
          option_id: options.optionId,
          question_id: options.questionId,
          option_text: options.optionText,
          is_correct: options.isCorrect,
          explanation: options.explanation,
          video_id: options.videoId,
          explanation_video_title: videos.title,
        })
        .from(options)
        .leftJoin(videos, eq(options.videoId, videos.videoId))
        .where(eq(options.questionId, questionId))
        .orderBy(options.optionId);

      const question = questionResult[0];
      question.options = optionsResult;

      this.success(res, question);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/questions/:questionId/options - Get options for a question
   */
  async getQuestionOptions(req, res, next) {
    try {
      const { questionId } = req.params;

      const questionExists = await this.checkRelatedCount(db, questions, questions.questionId, questionId);
      if (questionExists === 0) {
        this.throwNotFound("Question");
      }

      const result = await db
        .select({
          option_id: options.optionId,
          question_id: options.questionId,
          option_text: options.optionText,
          is_correct: options.isCorrect,
          explanation: options.explanation,
          video_id: options.videoId,
          explanation_video_title: videos.title,
        })
        .from(options)
        .leftJoin(videos, eq(options.videoId, videos.videoId))
        .where(eq(options.questionId, questionId))
        .orderBy(options.optionId);

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/questions/:questionId/images - Get images for a question
   */
  async getQuestionImages(req, res, next) {
    try {
      const { questionId } = req.params;

      const questionExists = await this.checkRelatedCount(db, questions, questions.questionId, questionId);
      if (questionExists === 0) {
        this.throwNotFound("Question");
      }

      const result = await db
        .select({
          image_id: images.imageId,
          image_url: images.imageUrl,
          alt_text: images.altText,
        })
        .from(images)
        .innerJoin(questionImages, eq(images.imageId, questionImages.imageId))
        .where(eq(questionImages.questionId, questionId))
        .orderBy(images.imageId);

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/questions/:questionId/videos - Get videos for a question
   */
  async getQuestionVideos(req, res, next) {
    try {
      const { questionId } = req.params;

      const questionExists = await this.checkRelatedCount(db, questions, questions.questionId, questionId);
      if (questionExists === 0) {
        this.throwNotFound("Question");
      }

      const result = await db
        .select({
          video_id: videos.videoId,
          title: videos.title,
          description: videos.description,
          slides_url: videos.slidesUrl,
          image_id: videos.imageId,
        })
        .from(videos)
        .innerJoin(questionVideos, eq(videos.videoId, questionVideos.videoId))
        .where(eq(questionVideos.questionId, questionId))
        .orderBy(videos.videoId);

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/questions - Create question
   */
  async createQuestion(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const { test_id, question_text, image_ids, video_ids } = req.body;

        const validatedText = this.validateRequired(question_text, "Question text");

        if (!test_id) {
          throw this.createError("Test ID is required", 400);
        }

        await this.getOrThrow(tx, tests, tests.testId, test_id, "Test");

        const [question] = await tx
          .insert(questions)
          .values({
            testId: test_id,
            questionText: validatedText,
            isArchived: false,
            createdAt: new Date(),
          })
          .returning();

        if (image_ids?.length > 0) {
          await tx.insert(questionImages).values(
            image_ids.map(imageId => ({ questionId: question.questionId, imageId }))
          );
        }

        if (video_ids?.length > 0) {
          await tx.insert(questionVideos).values(
            video_ids.map(videoId => ({ questionId: question.questionId, videoId }))
          );
        }

        return question;
      });

      this.success(res, result, null, 201);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * PUT /api/questions/:questionId - Update question
   */
  async updateQuestion(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const { questionId } = req.params;
        const { question_text, image_ids, video_ids } = req.body;

        await this.getOrThrow(tx, questions, questions.questionId, questionId, "Question");

        const updateFields = { updatedAt: new Date() };
        if (question_text !== undefined) updateFields.questionText = question_text;

        const [updated] = await tx
          .update(questions)
          .set(updateFields)
          .where(eq(questions.questionId, questionId))
          .returning();

        if (image_ids !== undefined) {
          await tx.delete(questionImages).where(eq(questionImages.questionId, questionId));
          if (image_ids.length > 0) {
            await tx.insert(questionImages).values(
              image_ids.map(imageId => ({ questionId: Number(questionId), imageId }))
            );
          }
        }

        if (video_ids !== undefined) {
          await tx.delete(questionVideos).where(eq(questionVideos.questionId, questionId));
          if (video_ids.length > 0) {
            await tx.insert(questionVideos).values(
              video_ids.map(videoId => ({ questionId: Number(questionId), videoId }))
            );
          }
        }

        return updated;
      });

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/questions/:questionId/archive - Archive question indefinitely
   */
  async archiveQuestion(req, res, next) {
    try {
      const { questionId } = req.params;
      const updated = await this.archive(db, questions, questions.questionId, questionId, "Question");
      this.success(res, updated, "Question archived");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/questions/:questionId/restore - Restore archived question
   */
  async restoreQuestion(req, res, next) {
    try {
      const { questionId } = req.params;
      const updated = await this.restore(db, questions, questions.questionId, questionId, "Question");
      this.success(res, updated, "Question restored");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * DELETE /api/questions/:questionId - Soft delete with countdown
   */
  async deleteQuestion(req, res, next) {
    try {
      await this.withTransaction(db, async (tx) => {
        const { questionId } = req.params;

        await this.getOrThrow(tx, questions, questions.questionId, questionId, "Question");

        const optionCount = await this.checkRelatedCount(tx, options, options.questionId, questionId);
        if (optionCount > 0) {
          throw this.createError("Cannot delete question with existing options. Delete options first.", 400);
        }

        await archiveEntity(tx, questions, questions.questionId, questionId, TimeUntilDeletion);
      });

      schedulePurge(TimeUntilDeletion);

      this.success(res, null, "Question scheduled for deletion in 60 seconds.");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }
}

module.exports = new QuestionController();
