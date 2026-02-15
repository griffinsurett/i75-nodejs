// backend/domains/option/option.controller.js
const { db } = require("../../config/database");
const {
  options,
  questions,
  videos,
  images,
  optionImages,
  optionVideos,
} = require("../../config/schema");
const { eq } = require("drizzle-orm");
const BaseController = require("../../shared/utils/baseController");
const { archiveEntity } = require("../../shared/utils/cascadeDelete");
const { schedulePurge } = require("../../shared/workers/archivePurger");

const TimeUntilDeletion = 60000;

class OptionController extends BaseController {
  /**
   * GET /api/options - Get all options with optional archive filter
   */
  async getAllOptions(req, res, next) {
    try {
      const showArchived = String(req.query.archived || "").toLowerCase() === "true";

      const result = await db
        .select({
          option_id: options.optionId,
          question_id: options.questionId,
          option_text: options.optionText,
          is_correct: options.isCorrect,
          explanation: options.explanation,
          video_id: options.videoId,
          question_text: questions.questionText,
          explanation_video_title: videos.title,
        })
        .from(options)
        .innerJoin(questions, eq(options.questionId, questions.questionId))
        .leftJoin(videos, eq(options.videoId, videos.videoId))
        .where(eq(options.isArchived, showArchived))
        .orderBy(questions.questionId, options.optionId);

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/options/:optionId - Get single option
   */
  async getOptionById(req, res, next) {
    try {
      const { optionId } = req.params;

      const result = await db
        .select({
          option_id: options.optionId,
          question_id: options.questionId,
          option_text: options.optionText,
          is_correct: options.isCorrect,
          explanation: options.explanation,
          video_id: options.videoId,
          question_text: questions.questionText,
          explanation_video_title: videos.title,
        })
        .from(options)
        .innerJoin(questions, eq(options.questionId, questions.questionId))
        .leftJoin(videos, eq(options.videoId, videos.videoId))
        .where(eq(options.optionId, optionId));

      if (result.length === 0) {
        this.throwNotFound("Option");
      }

      this.success(res, result[0]);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/options/:optionId/images - Get images for an option
   */
  async getOptionImages(req, res, next) {
    try {
      const { optionId } = req.params;

      const optionExists = await this.checkRelatedCount(db, options, options.optionId, optionId);
      if (optionExists === 0) {
        this.throwNotFound("Option");
      }

      const result = await db
        .select({
          image_id: images.imageId,
          image_url: images.imageUrl,
          alt_text: images.altText,
        })
        .from(images)
        .innerJoin(optionImages, eq(images.imageId, optionImages.imageId))
        .where(eq(optionImages.optionId, optionId))
        .orderBy(images.imageId);

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/options/:optionId/videos - Get videos for an option
   */
  async getOptionVideos(req, res, next) {
    try {
      const { optionId } = req.params;

      const optionExists = await this.checkRelatedCount(db, options, options.optionId, optionId);
      if (optionExists === 0) {
        this.throwNotFound("Option");
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
        .innerJoin(optionVideos, eq(videos.videoId, optionVideos.videoId))
        .where(eq(optionVideos.optionId, optionId))
        .orderBy(videos.videoId);

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/options - Create option
   */
  async createOption(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const {
          question_id,
          option_text,
          is_correct,
          explanation,
          video_id,
          image_ids,
          video_ids,
        } = req.body;

        const validatedText = this.validateRequired(option_text, "Option text");

        if (!question_id) {
          throw this.createError("Question ID is required", 400);
        }
        if (is_correct === undefined) {
          throw this.createError("is_correct flag is required", 400);
        }

        await this.getOrThrow(tx, questions, questions.questionId, question_id, "Question");

        const [option] = await tx
          .insert(options)
          .values({
            questionId: question_id,
            optionText: validatedText,
            isCorrect: is_correct,
            explanation: explanation || null,
            videoId: video_id || null,
            isArchived: false,
            createdAt: new Date(),
          })
          .returning();

        if (image_ids?.length > 0) {
          await tx.insert(optionImages).values(
            image_ids.map(imageId => ({ optionId: option.optionId, imageId }))
          );
        }

        if (video_ids?.length > 0) {
          await tx.insert(optionVideos).values(
            video_ids.map(videoId => ({ optionId: option.optionId, videoId }))
          );
        }

        return option;
      });

      this.success(res, result, null, 201);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * PUT /api/options/:optionId - Update option
   */
  async updateOption(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const { optionId } = req.params;
        const {
          option_text,
          is_correct,
          explanation,
          video_id,
          image_ids,
          video_ids,
        } = req.body;

        await this.getOrThrow(tx, options, options.optionId, optionId, "Option");

        const updateFields = { updatedAt: new Date() };
        if (option_text !== undefined) updateFields.optionText = option_text;
        if (is_correct !== undefined) updateFields.isCorrect = is_correct;
        if (explanation !== undefined) updateFields.explanation = explanation;
        if (video_id !== undefined) updateFields.videoId = video_id;

        const [updated] = await tx
          .update(options)
          .set(updateFields)
          .where(eq(options.optionId, optionId))
          .returning();

        if (image_ids !== undefined) {
          await tx.delete(optionImages).where(eq(optionImages.optionId, optionId));
          if (image_ids.length > 0) {
            await tx.insert(optionImages).values(
              image_ids.map(imageId => ({ optionId: Number(optionId), imageId }))
            );
          }
        }

        if (video_ids !== undefined) {
          await tx.delete(optionVideos).where(eq(optionVideos.optionId, optionId));
          if (video_ids.length > 0) {
            await tx.insert(optionVideos).values(
              video_ids.map(videoId => ({ optionId: Number(optionId), videoId }))
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
   * POST /api/options/:optionId/archive - Archive option indefinitely
   */
  async archiveOption(req, res, next) {
    try {
      const { optionId } = req.params;
      const updated = await this.archive(db, options, options.optionId, optionId, "Option");
      this.success(res, updated, "Option archived");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/options/:optionId/restore - Restore archived option
   */
  async restoreOption(req, res, next) {
    try {
      const { optionId } = req.params;
      const updated = await this.restore(db, options, options.optionId, optionId, "Option");
      this.success(res, updated, "Option restored");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * DELETE /api/options/:optionId - Soft delete with countdown
   */
  async deleteOption(req, res, next) {
    try {
      await this.withTransaction(db, async (tx) => {
        const { optionId } = req.params;

        await this.getOrThrow(tx, options, options.optionId, optionId, "Option");

        await archiveEntity(tx, options, options.optionId, optionId, TimeUntilDeletion);
      });

      schedulePurge(TimeUntilDeletion);

      this.success(res, null, "Option scheduled for deletion in 60 seconds.");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }
}

module.exports = new OptionController();
