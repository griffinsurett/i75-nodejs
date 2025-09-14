// ==================== controllers/optionController.js ====================
const { db } = require("../../config/database");
const { 
  options, 
  questions, 
  videos, 
  images, 
  optionImages, 
  optionVideos 
} = require("../../config/schema");
const { eq, count } = require("drizzle-orm");

const optionController = {
  // Get all options
  getAllOptions: async (req, res, next) => {
    try {
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
        .orderBy(questions.questionId, options.optionId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get options by question
  getOptionsByQuestion: async (req, res, next) => {
    try {
      const { questionId } = req.params;

      // Check if question exists
      const questionCheck = await db
        .select({ count: count() })
        .from(questions)
        .where(eq(questions.questionId, questionId));

      if (questionCheck[0].count === 0) {
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
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

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single option
  getOptionById: async (req, res, next) => {
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
        return res.status(404).json({
          success: false,
          message: "Option not found",
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

  // Get option images
  getOptionImages: async (req, res, next) => {
    try {
      const { optionId } = req.params;

      // Check if option exists
      const optionCheck = await db
        .select({ count: count() })
        .from(options)
        .where(eq(options.optionId, optionId));

      if (optionCheck[0].count === 0) {
        return res.status(404).json({
          success: false,
          message: "Option not found",
        });
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

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get option videos
  getOptionVideos: async (req, res, next) => {
    try {
      const { optionId } = req.params;

      // Check if option exists
      const optionCheck = await db
        .select({ count: count() })
        .from(options)
        .where(eq(options.optionId, optionId));

      if (optionCheck[0].count === 0) {
        return res.status(404).json({
          success: false,
          message: "Option not found",
        });
      }

      const result = await db
        .select({
          video_id: videos.videoId,
          title: videos.title,
          description: videos.description,
          slides_url: videos.slidesUrl,
          thumbnail_image_id: videos.thumbnailImageId,
        })
        .from(videos)
        .innerJoin(optionVideos, eq(videos.videoId, optionVideos.videoId))
        .where(eq(optionVideos.optionId, optionId))
        .orderBy(videos.videoId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Create option
  createOption: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const {
          question_id,
          option_text,
          is_correct,
          explanation,
          video_id,
          image_ids,
          video_ids,
        } = req.body;

        if (!question_id || !option_text || is_correct === undefined) {
          throw new Error("Question ID, option text, and is_correct flag are required");
        }

        // Check if question exists
        const questionCheck = await tx
          .select({ count: count() })
          .from(questions)
          .where(eq(questions.questionId, question_id));

        if (questionCheck[0].count === 0) {
          throw new Error("Question not found");
        }

        const optionResult = await tx
          .insert(options)
          .values({
            questionId: question_id,
            optionText: option_text,
            isCorrect: is_correct,
            explanation,
            videoId: video_id,
          })
          .returning();

        const option = optionResult[0];

        // Add image associations if provided
        if (image_ids && image_ids.length > 0) {
          const imageValues = image_ids.map(image_id => ({
            optionId: option.optionId,
            imageId: image_id,
          }));
          await tx.insert(optionImages).values(imageValues);
        }

        // Add video associations if provided
        if (video_ids && video_ids.length > 0) {
          const videoValues = video_ids.map(video_id => ({
            optionId: option.optionId,
            videoId: video_id,
          }));
          await tx.insert(optionVideos).values(videoValues);
        }

        return option;
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message === "Question ID, option text, and is_correct flag are required" ||
          error.message === "Question not found") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },

  // Update option
  updateOption: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { optionId } = req.params;
        const {
          option_text,
          is_correct,
          explanation,
          video_id,
          image_ids,
          video_ids,
        } = req.body;

        // Check if option exists
        const existingOption = await tx
          .select()
          .from(options)
          .where(eq(options.optionId, optionId));

        if (existingOption.length === 0) {
          throw new Error("Option not found");
        }

        const updateResult = await tx
          .update(options)
          .set({
            optionText: option_text,
            isCorrect: is_correct,
            explanation,
            videoId: video_id,
          })
          .where(eq(options.optionId, optionId))
          .returning();

        // Update image associations if provided
        if (image_ids !== undefined) {
          // Delete existing associations
          await tx
            .delete(optionImages)
            .where(eq(optionImages.optionId, optionId));

          // Add new associations
          if (image_ids.length > 0) {
            const imageValues = image_ids.map(image_id => ({
              optionId,
              imageId: image_id,
            }));
            await tx.insert(optionImages).values(imageValues);
          }
        }

        // Update video associations if provided
        if (video_ids !== undefined) {
          // Delete existing associations
          await tx
            .delete(optionVideos)
            .where(eq(optionVideos.optionId, optionId));

          // Add new associations
          if (video_ids.length > 0) {
            const videoValues = video_ids.map(video_id => ({
              optionId,
              videoId: video_id,
            }));
            await tx.insert(optionVideos).values(videoValues);
          }
        }

        return updateResult[0];
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message === "Option not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },

  // Delete option
  deleteOption: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { optionId } = req.params;

        // Delete option image associations
        await tx
          .delete(optionImages)
          .where(eq(optionImages.optionId, optionId));

        // Delete option video associations
        await tx
          .delete(optionVideos)
          .where(eq(optionVideos.optionId, optionId));

        // Delete the option
        const deleteResult = await tx
          .delete(options)
          .where(eq(options.optionId, optionId))
          .returning();

        if (deleteResult.length === 0) {
          throw new Error("Option not found");
        }

        return deleteResult[0];
      });

      res.json({
        success: true,
        message: "Option and all related data deleted successfully",
      });
    } catch (error) {
      if (error.message === "Option not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },
};

module.exports = optionController;