// ==================== controllers/videoController.js ====================
const { db } = require("../../config/database");
const { 
  videos, 
  images, 
  courses, 
  sections, 
  tests, 
  options, 
  entries, 
  optionVideos, 
  questionVideos 
} = require("../../config/schema");
const { eq, count } = require("drizzle-orm");

const videoController = {
  // Get all videos
  getAllVideos: async (req, res, next) => {
    try {
      const result = await db
        .select({
          video_id: videos.videoId,
          title: videos.title,
          description: videos.description,
          slides_url: videos.slidesUrl,
          thumbnail_image_id: videos.thumbnailImageId,
          thumbnail_url: images.imageUrl,
          thumbnail_alt: images.altText,
        })
        .from(videos)
        .leftJoin(images, eq(videos.thumbnailImageId, images.imageId))
        .orderBy(videos.title);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single video
  getVideoById: async (req, res, next) => {
    try {
      const { videoId } = req.params;

      const result = await db
        .select({
          video_id: videos.videoId,
          title: videos.title,
          description: videos.description,
          slides_url: videos.slidesUrl,
          thumbnail_image_id: videos.thumbnailImageId,
          thumbnail_url: images.imageUrl,
          thumbnail_alt: images.altText,
        })
        .from(videos)
        .leftJoin(images, eq(videos.thumbnailImageId, images.imageId))
        .where(eq(videos.videoId, videoId));

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Video not found",
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

  // Create new video
  createVideo: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { title, description, slides_url, thumbnail_url, thumbnail_alt } = req.body;

        // Validation
        if (!title) {
          throw new Error("Title is required");
        }

        let thumbnail_image_id = null;
        if (thumbnail_url) {
          const imageResult = await tx
            .insert(images)
            .values({
              imageUrl: thumbnail_url,
              altText: thumbnail_alt,
            })
            .returning({ imageId: images.imageId });
          thumbnail_image_id = imageResult[0].imageId;
        }

        const videoResult = await tx
          .insert(videos)
          .values({
            title,
            description,
            slidesUrl: slides_url,
            thumbnailImageId: thumbnail_image_id,
          })
          .returning();

        return videoResult[0];
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message === "Title is required") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },

  // Update video
  updateVideo: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { videoId } = req.params;
        const { title, description, slides_url, thumbnail_url, thumbnail_alt } = req.body;

        // Check if video exists
        const existingVideo = await tx
          .select()
          .from(videos)
          .where(eq(videos.videoId, videoId));

        if (existingVideo.length === 0) {
          throw new Error("Video not found");
        }

        // Handle thumbnail update
        let thumbnail_image_id = existingVideo[0].thumbnailImageId;
        if (thumbnail_url) {
          if (thumbnail_image_id) {
            // Update existing thumbnail
            await tx
              .update(images)
              .set({
                imageUrl: thumbnail_url,
                altText: thumbnail_alt,
              })
              .where(eq(images.imageId, thumbnail_image_id));
          } else {
            // Create new thumbnail
            const imageResult = await tx
              .insert(images)
              .values({
                imageUrl: thumbnail_url,
                altText: thumbnail_alt,
              })
              .returning({ imageId: images.imageId });
            thumbnail_image_id = imageResult[0].imageId;
          }
        }

        const updateResult = await tx
          .update(videos)
          .set({
            title,
            description,
            slidesUrl: slides_url,
            thumbnailImageId: thumbnail_image_id,
          })
          .where(eq(videos.videoId, videoId))
          .returning();

        return updateResult[0];
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.message === "Video not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },

  // Delete video
  deleteVideo: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { videoId } = req.params;

        // Check if video is used in other tables
        const usageChecks = await Promise.all([
          tx.select({ count: count() }).from(courses).where(eq(courses.videoId, videoId)),
          tx.select({ count: count() }).from(sections).where(eq(sections.videoId, videoId)),
          tx.select({ count: count() }).from(tests).where(eq(tests.videoId, videoId)),
          tx.select({ count: count() }).from(options).where(eq(options.videoId, videoId)),
          tx.select({ count: count() }).from(entries).where(eq(entries.videoId, videoId)),
          tx.select({ count: count() }).from(optionVideos).where(eq(optionVideos.videoId, videoId)),
          tx.select({ count: count() }).from(questionVideos).where(eq(questionVideos.videoId, videoId)),
        ]);

        const totalUsage = usageChecks.reduce((sum, check) => sum + check[0].count, 0);

        if (totalUsage > 0) {
          throw new Error("Cannot delete video that is being used in courses, sections, tests, options, entries, or question/option associations");
        }

        const deleteResult = await tx
          .delete(videos)
          .where(eq(videos.videoId, videoId))
          .returning();

        if (deleteResult.length === 0) {
          throw new Error("Video not found");
        }

        return deleteResult[0];
      });

      res.json({
        success: true,
        message: "Video deleted successfully",
      });
    } catch (error) {
      if (error.message === "Video not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      if (error.message.includes("Cannot delete video")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  },
};

module.exports = videoController;