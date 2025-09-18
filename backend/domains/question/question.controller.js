// ==================== controllers/questionController.js ====================
const { db } = require("../../config/database");
const { 
  questions, 
  tests, 
  chapters, 
  options, 
  videos, 
  images, 
  questionImages, 
  questionVideos 
} = require("../../config/schema");
const { eq, count } = require("drizzle-orm");

const questionController = {
  // Get all questions
  getAllQuestions: async (req, res, next) => {
    try {
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
        .orderBy(tests.title, questions.questionId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get questions by test
  getQuestionsByTest: async (req, res, next) => {
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

  // Get single question with options
  getQuestionById: async (req, res, next) => {
    try {
      const { questionId } = req.params;

      // Get question details
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
        return res.status(404).json({
          success: false,
          message: "Question not found",
        });
      }

      // Get options for this question
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

      res.json({
        success: true,
        data: question,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get options for a question
  getQuestionOptions: async (req, res, next) => {
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

  // Get question images
  getQuestionImages: async (req, res, next) => {
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
          image_id: images.imageId,
          image_url: images.imageUrl,
          alt_text: images.altText,
        })
        .from(images)
        .innerJoin(questionImages, eq(images.imageId, questionImages.imageId))
        .where(eq(questionImages.questionId, questionId))
        .orderBy(images.imageId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get question videos
  getQuestionVideos: async (req, res, next) => {
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

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Create question
  createQuestion: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { test_id, question_text, image_ids, video_ids } = req.body;

        if (!test_id || !question_text) {
          throw new Error("Test ID and question text are required");
        }

        // Check if test exists
        const testCheck = await tx
          .select({ count: count() })
          .from(tests)
          .where(eq(tests.testId, test_id));

        if (testCheck[0].count === 0) {
          throw new Error("Test not found");
        }

        const questionResult = await tx
          .insert(questions)
          .values({
            testId: test_id,
            questionText: question_text,
          })
          .returning();

        const question = questionResult[0];

        // Add image associations if provided
        if (image_ids && image_ids.length > 0) {
          const imageValues = image_ids.map(image_id => ({
            questionId: question.questionId,
            imageId: image_id,
          }));
          await tx.insert(questionImages).values(imageValues);
        }

        // Add video associations if provided
        if (video_ids && video_ids.length > 0) {
          const videoValues = video_ids.map(video_id => ({
            questionId: question.questionId,
            videoId: video_id,
          }));
          await tx.insert(questionVideos).values(videoValues);
        }

        return question;
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message === "Test ID and question text are required" ||
          error.message === "Test not found") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },

  // Update question
  updateQuestion: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { questionId } = req.params;
        const { question_text, image_ids, video_ids } = req.body;

        // Check if question exists
        const existingQuestion = await tx
          .select()
          .from(questions)
          .where(eq(questions.questionId, questionId));

        if (existingQuestion.length === 0) {
          throw new Error("Question not found");
        }

        const updateResult = await tx
          .update(questions)
          .set({
            questionText: question_text,
          })
          .where(eq(questions.questionId, questionId))
          .returning();

        // Update image associations if provided
        if (image_ids !== undefined) {
          // Delete existing associations
          await tx
            .delete(questionImages)
            .where(eq(questionImages.questionId, questionId));

          // Add new associations
          if (image_ids.length > 0) {
            const imageValues = image_ids.map(image_id => ({
              questionId,
              imageId: image_id,
            }));
            await tx.insert(questionImages).values(imageValues);
          }
        }

        // Update video associations if provided
        if (video_ids !== undefined) {
          // Delete existing associations
          await tx
            .delete(questionVideos)
            .where(eq(questionVideos.questionId, questionId));

          // Add new associations
          if (video_ids.length > 0) {
            const videoValues = video_ids.map(video_id => ({
              questionId,
              videoId: video_id,
            }));
            await tx.insert(questionVideos).values(videoValues);
          }
        }

        return updateResult[0];
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message === "Question not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },

  // Delete question
  deleteQuestion: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { questionId } = req.params;

        // Delete all options for this question first
        await tx
          .delete(options)
          .where(eq(options.questionId, questionId));

        // Delete question image associations
        await tx
          .delete(questionImages)
          .where(eq(questionImages.questionId, questionId));

        // Delete question video associations
        await tx
          .delete(questionVideos)
          .where(eq(questionVideos.questionId, questionId));

        // Delete the question
        const deleteResult = await tx
          .delete(questions)
          .where(eq(questions.questionId, questionId))
          .returning();

        if (deleteResult.length === 0) {
          throw new Error("Question not found");
        }

        return deleteResult[0];
      });

      res.json({
        success: true,
        message: "Question and all related data deleted successfully",
      });
    } catch (error) {
      if (error.message === "Question not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },
};

module.exports = questionController;