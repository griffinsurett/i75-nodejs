// ==================== controllers/imageController.js ====================
const { db } = require("../../config/database");
const { 
  images, 
  courses, 
  instructors, 
  sections, 
  chapters, 
  tests, 
  videos, 
  questions,
  options,
  questionImages, 
  optionImages 
} = require("../../config/schema");
const { eq, count } = require("drizzle-orm");

const imageController = {
  // Get all images with usage counts
  getAllImages: async (req, res, next) => {
    try {
      // Get all images first
      const allImages = await db
        .select({
          image_id: images.imageId,
          image_url: images.imageUrl,
          alt_text: images.altText,
        })
        .from(images)
        .orderBy(images.imageUrl);

      // Get usage counts for each image
      const enrichedImages = await Promise.all(
        allImages.map(async (image) => {
          const [
            coursesCount,
            instructorsCount,
            sectionsCount,
            chaptersCount,
            testsCount,
            videosCount,
            questionsCount,
            optionsCount,
          ] = await Promise.all([
            db.select({ count: count() }).from(courses).where(eq(courses.imageId, image.image_id)),
            db.select({ count: count() }).from(instructors).where(eq(instructors.imageId, image.image_id)),
            db.select({ count: count() }).from(sections).where(eq(sections.imageId, image.image_id)),
            db.select({ count: count() }).from(chapters).where(eq(chapters.imageId, image.image_id)),
            db.select({ count: count() }).from(tests).where(eq(tests.imageId, image.image_id)),
            db.select({ count: count() }).from(videos).where(eq(videos.thumbnailImageId, image.image_id)),
            db.select({ count: count() }).from(questionImages).where(eq(questionImages.imageId, image.image_id)),
            db.select({ count: count() }).from(optionImages).where(eq(optionImages.imageId, image.image_id)),
          ]);

          return {
            ...image,
            used_in_courses: coursesCount[0].count,
            used_in_instructors: instructorsCount[0].count,
            used_in_sections: sectionsCount[0].count,
            used_in_chapters: chaptersCount[0].count,
            used_in_tests: testsCount[0].count,
            used_in_videos: videosCount[0].count,
            used_in_questions: questionsCount[0].count,
            used_in_options: optionsCount[0].count,
          };
        })
      );

      res.json({
        success: true,
        data: enrichedImages,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single image
  getImageById: async (req, res, next) => {
    try {
      const { imageId } = req.params;

      const result = await db
        .select({
          image_id: images.imageId,
          image_url: images.imageUrl,
          alt_text: images.altText,
        })
        .from(images)
        .where(eq(images.imageId, imageId));

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Image not found",
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

  // Get image usage details
  getImageUsage: async (req, res, next) => {
    try {
      const { imageId } = req.params;

      // Check if image exists
      const imageExists = await db
        .select({
          image_id: images.imageId,
          image_url: images.imageUrl,
          alt_text: images.altText,
        })
        .from(images)
        .where(eq(images.imageId, imageId));

      if (imageExists.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Image not found",
        });
      }

      const usage = {
        image: imageExists[0],
        used_in: {},
      };

      // Get detailed usage information for each table
      const [
        coursesUsage,
        instructorsUsage,
        sectionsUsage,
        chaptersUsage,
        testsUsage,
        videosUsage,
        questionsUsage,
        optionsUsage,
      ] = await Promise.all([
        // Courses using this image
        db.select({
          course_id: courses.courseId,
          course_name: courses.courseName,
        }).from(courses).where(eq(courses.imageId, imageId)),

        // Instructors using this image
        db.select({
          instructor_id: instructors.instructorId,
          name: instructors.name,
        }).from(instructors).where(eq(instructors.imageId, imageId)),

        // Sections using this image
        db.select({
          section_id: sections.sectionId,
          title: sections.title,
        }).from(sections).where(eq(sections.imageId, imageId)),

        // Chapters using this image
        db.select({
          chapter_id: chapters.chapterId,
          title: chapters.title,
        }).from(chapters).where(eq(chapters.imageId, imageId)),

        // Tests using this image
        db.select({
          test_id: tests.testId,
          title: tests.title,
        }).from(tests).where(eq(tests.imageId, imageId)),

        // Videos using this image as thumbnail
        db.select({
          video_id: videos.videoId,
          title: videos.title,
        }).from(videos).where(eq(videos.thumbnailImageId, imageId)),

        // Questions using this image
        db.select({
          question_id: questions.questionId,
          question_text: questions.questionText,
        })
        .from(questions)
        .innerJoin(questionImages, eq(questions.questionId, questionImages.questionId))
        .where(eq(questionImages.imageId, imageId)),

        // Options using this image
        db.select({
          option_id: options.optionId,
          option_text: options.optionText,
        })
        .from(options)
        .innerJoin(optionImages, eq(options.optionId, optionImages.optionId))
        .where(eq(optionImages.imageId, imageId)),
      ]);

      usage.used_in = {
        courses: coursesUsage,
        instructors: instructorsUsage,
        sections: sectionsUsage,
        chapters: chaptersUsage,
        tests: testsUsage,
        videos: videosUsage,
        questions: questionsUsage,
        options: optionsUsage,
      };

      res.json({
        success: true,
        data: usage,
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new image
  createImage: async (req, res, next) => {
    try {
      const { image_url, alt_text } = req.body;

      if (!image_url) {
        return res.status(400).json({
          success: false,
          message: "Image URL is required",
        });
      }

      const result = await db
        .insert(images)
        .values({
          imageUrl: image_url,
          altText: alt_text,
        })
        .returning({
          image_id: images.imageId,
          image_url: images.imageUrl,
          alt_text: images.altText,
        });

      res.status(201).json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      next(error);
    }
  },

  // Update image
  updateImage: async (req, res, next) => {
    try {
      const { imageId } = req.params;
      const { image_url, alt_text } = req.body;

      const result = await db
        .update(images)
        .set({
          imageUrl: image_url,
          altText: alt_text,
        })
        .where(eq(images.imageId, imageId))
        .returning({
          image_id: images.imageId,
          image_url: images.imageUrl,
          alt_text: images.altText,
        });

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Image not found",
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

  // Delete image
  deleteImage: async (req, res, next) => {
    try {
      await db.transaction(async (tx) => {
        const { imageId } = req.params;

        // Check if image is being used anywhere
        const [
          coursesUsage,
          instructorsUsage,
          sectionsUsage,
          chaptersUsage,
          testsUsage,
          videosUsage,
          questionImagesUsage,
          optionImagesUsage,
        ] = await Promise.all([
          tx.select({ count: count() }).from(courses).where(eq(courses.imageId, imageId)),
          tx.select({ count: count() }).from(instructors).where(eq(instructors.imageId, imageId)),
          tx.select({ count: count() }).from(sections).where(eq(sections.imageId, imageId)),
          tx.select({ count: count() }).from(chapters).where(eq(chapters.imageId, imageId)),
          tx.select({ count: count() }).from(tests).where(eq(tests.imageId, imageId)),
          tx.select({ count: count() }).from(videos).where(eq(videos.thumbnailImageId, imageId)),
          tx.select({ count: count() }).from(questionImages).where(eq(questionImages.imageId, imageId)),
          tx.select({ count: count() }).from(optionImages).where(eq(optionImages.imageId, imageId)),
        ]);

        const totalUsage = 
          coursesUsage[0].count +
          instructorsUsage[0].count +
          sectionsUsage[0].count +
          chaptersUsage[0].count +
          testsUsage[0].count +
          videosUsage[0].count +
          questionImagesUsage[0].count +
          optionImagesUsage[0].count;

        if (totalUsage > 0) {
          return res.status(400).json({
            success: false,
            message: "Cannot delete image that is being used in courses, instructors, sections, chapters, tests, videos, questions, or options. Remove from all references first.",
            usage_count: totalUsage,
          });
        }

        const deleteResult = await tx
          .delete(images)
          .where(eq(images.imageId, imageId))
          .returning({
            image_id: images.imageId,
          });

        if (deleteResult.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Image not found",
          });
        }

        res.json({
          success: true,
          message: "Image deleted successfully",
        });
      });
    } catch (error) {
      next(error);
    }
  },

  // Bulk upload images
  bulkCreateImages: async (req, res, next) => {
    try {
      await db.transaction(async (tx) => {
        const { images: imageData } = req.body;

        if (!imageData || !Array.isArray(imageData) || imageData.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Images array is required and must not be empty",
          });
        }

        const results = [];

        for (const imageItem of imageData) {
          const { image_url, alt_text } = imageItem;

          if (!image_url) {
            throw new Error("All images must have image_url");
          }

          const result = await tx
            .insert(images)
            .values({
              imageUrl: image_url,
              altText: alt_text,
            })
            .returning({
              image_id: images.imageId,
              image_url: images.imageUrl,
              alt_text: images.altText,
            });

          results.push(result[0]);
        }

        res.status(201).json({
          success: true,
          message: `Successfully created ${results.length} images`,
          data: results,
        });
      });
    } catch (error) {
      if (error.message === "All images must have image_url") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },
};

module.exports = imageController;