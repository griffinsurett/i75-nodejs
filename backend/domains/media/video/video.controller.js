// ==================== domains/media/video/video.controller.js ====================
const { db } = require("../../../config/database");
const {
  videos,
  images,
  courses,
  sections,
  tests,
  options,
  entries,
  optionVideos,
  questionVideos,
} = require("../../../config/schema");
const { eq, count } = require("drizzle-orm");

const ONE_MINUTE_MS = 60 * 1000;

const videoController = {
  /**
   * GET /api/videos - Get all videos with optional archive filter
   */
  getAllVideos: async (req, res, next) => {
    try {
      const showArchived = String(req.query.archived || "").toLowerCase() === "true";

      const result = await db
        .select({
          video_id: videos.videoId,
          title: videos.title,
          description: videos.description,
          slides_url: videos.slidesUrl,
          thumbnail_image_id: videos.thumbnailImageId,
          thumbnail_url: images.imageUrl,
          thumbnail_alt: images.altText,
          is_archived: videos.isArchived,
          archived_at: videos.archivedAt,
          purge_after_at: videos.purgeAfterAt,
          created_at: videos.createdAt,
          updated_at: videos.updatedAt,
        })
        .from(videos)
        .leftJoin(images, eq(videos.thumbnailImageId, images.imageId))
        .where(eq(videos.isArchived, showArchived))
        .orderBy(videos.title);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/videos/:videoId - Get single video by ID
   */
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
          is_archived: videos.isArchived,
          archived_at: videos.archivedAt,
          purge_after_at: videos.purgeAfterAt,
          created_at: videos.createdAt,
          updated_at: videos.updatedAt,
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

      res.json({ success: true, data: result[0] });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/videos - Create new video
   */
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
            isArchived: false,
            createdAt: new Date(),
          })
          .returning();

        return videoResult[0];
      });

      res.status(201).json({ success: true, data: result });
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

  /**
   * PUT /api/videos/:videoId - Update existing video
   */
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
                updatedAt: new Date(),
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

        const updateData = {
          updatedAt: new Date(),
        };

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (slides_url !== undefined) updateData.slidesUrl = slides_url;
        if (thumbnail_image_id !== undefined) updateData.thumbnailImageId = thumbnail_image_id;

        const updateResult = await tx
          .update(videos)
          .set(updateData)
          .where(eq(videos.videoId, videoId))
          .returning();

        return updateResult[0];
      });

      res.json({ success: true, data: result });
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

  /**
   * POST /api/videos/upload - Upload video file
   */
  uploadVideo: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No video file uploaded",
        });
      }

      const { title, description } = req.body;

      if (!title) {
        // Clean up uploaded file if validation fails
        const uploadService = require('../upload/upload.service');
        await uploadService.deleteFile(req.file.path);
        return res.status(400).json({
          success: false,
          message: "Video title is required",
        });
      }

      const uploadService = require('../upload/upload.service');
      // Process file metadata
      const fileData = uploadService.processFile(req.file, req, "videos");

      // Save to database
      const [row] = await db
        .insert(videos)
        .values({
          title,
          description: description || null,
          slidesUrl: fileData.publicUrl,
          thumbnailImageId: null,
          isArchived: false,
          createdAt: new Date(),
        })
        .returning({
          video_id: videos.videoId,
          title: videos.title,
          description: videos.description,
          slides_url: videos.slidesUrl,
        });

      res.status(201).json({ 
        success: true, 
        data: row
      });
    } catch (err) {
      // Clean up file on error
      if (req.file) {
        const uploadService = require('../upload/upload.service');
        await uploadService.deleteFile(req.file.path);
      }
      next(err);
    }
  },

  /**
   * POST /api/videos/:videoId/archive - Archive video indefinitely
   */
  archiveVideo: async (req, res, next) => {
    try {
      const { videoId } = req.params;

      const result = await db.transaction(async (tx) => {
        const existing = await tx
          .select()
          .from(videos)
          .where(eq(videos.videoId, videoId));

        if (existing.length === 0) {
          throw new Error("Video not found");
        }

        // Check if already archived
        if (existing[0].isArchived) {
          throw new Error("Video is already archived");
        }

        // Check usage
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
          throw new Error("Cannot archive video that is currently in use");
        }

        const [updated] = await tx
          .update(videos)
          .set({
            isArchived: true,
            archivedAt: new Date(),
            purgeAfterAt: null,
            updatedAt: new Date(),
          })
          .where(eq(videos.videoId, videoId))
          .returning();

        return updated;
      });

      res.json({ success: true, data: result, message: "Video archived" });
    } catch (error) {
      if (error.message === "Video not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message.includes("Cannot archive") || error.message.includes("already archived")) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  /**
   * POST /api/videos/:videoId/restore - Restore archived video
   */
  restoreVideo: async (req, res, next) => {
    try {
      const { videoId } = req.params;

      const existing = await db.select().from(videos).where(eq(videos.videoId, videoId));
      
      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: "Video not found" });
      }

      if (!existing[0].isArchived) {
        return res.status(400).json({ success: false, message: "Video is not archived" });
      }

      const [updated] = await db
        .update(videos)
        .set({
          isArchived: false,
          archivedAt: null,
          purgeAfterAt: null,
          updatedAt: new Date(),
        })
        .where(eq(videos.videoId, videoId))
        .returning();

      res.json({ success: true, data: updated, message: "Video restored" });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/videos/:videoId - Schedule video for deletion (safety delete)
   */
  deleteVideo: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { videoId } = req.params;

        // Check existence
        const existing = await tx
          .select()
          .from(videos)
          .where(eq(videos.videoId, videoId));

        if (existing.length === 0) {
          throw new Error("Video not found");
        }

        // Check usage
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
          throw new Error(
            "Cannot delete video that is being used. Remove all references first."
          );
        }

        // Schedule for deletion
        const now = Date.now();
        const purgeAt = new Date(now + ONE_MINUTE_MS);

        const [updated] = await tx
          .update(videos)
          .set({
            isArchived: true,
            archivedAt: new Date(now),
            purgeAfterAt: purgeAt,
            updatedAt: new Date(now),
          })
          .where(eq(videos.videoId, videoId))
          .returning();

        return updated;
      });

      res.json({
        success: true,
        message: "Video scheduled for deletion in 60 seconds (archived now). Restore within a minute to cancel.",
        data: result,
      });
    } catch (error) {
      if (error.message === "Video not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message.includes("Cannot delete")) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = videoController;