// backend/domains/media/video/video.controller.js
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
const { eq } = require("drizzle-orm");
const BaseController = require("../../../shared/utils/baseController");
const videoService = require('./video.service');

const TimeUntilDeletion = 60000;

class VideoController extends BaseController {
  // Define usage tables for checking
  get usageTables() {
    return [
      { table: courses, field: courses.videoId },
      { table: sections, field: sections.videoId },
      { table: tests, field: tests.videoId },
      { table: options, field: options.videoId },
      { table: entries, field: entries.videoId },
      { table: optionVideos, field: optionVideos.videoId },
      { table: questionVideos, field: questionVideos.videoId },
    ];
  }

  /**
   * GET /api/videos
   */
 async getAllVideos(req, res, next) {
  try {
    const showArchived = String(req.query.archived || "").toLowerCase() === "true";

    const result = await db
      .select({
        video_id: videos.videoId,
        title: videos.title,
        description: videos.description,
        slides_url: videos.slidesUrl,
        file_size: videos.fileSize, // Add this
        mime_type: videos.mimeType, // Add this
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

    this.success(res, result);
  } catch (error) {
    this.handleError(error, res, next);
  }
}

  /**
   * GET /api/videos/:videoId
   */
  async getVideoById(req, res, next) {
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
        this.throwNotFound("Video");
      }

      this.success(res, result[0]);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/videos
   */
  async createVideo(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const { title, description, slides_url, thumbnail_url, thumbnail_alt } = req.body;

        this.validateRequired(title, "Title");

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

      this.success(res, result, null, 201);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * PUT /api/videos/:videoId
   */
  async updateVideo(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const { videoId } = req.params;
        const { title, description, slides_url, thumbnail_url, thumbnail_alt } = req.body;

        const existingVideo = await this.getOrThrow(tx, videos, videos.videoId, videoId, "Video");

        let thumbnail_image_id = existingVideo.thumbnailImageId;
        if (thumbnail_url) {
          if (thumbnail_image_id) {
            await tx
              .update(images)
              .set({
                imageUrl: thumbnail_url,
                altText: thumbnail_alt,
                updatedAt: new Date(),
              })
              .where(eq(images.imageId, thumbnail_image_id));
          } else {
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

        const updateData = { updatedAt: new Date() };
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (slides_url !== undefined) updateData.slidesUrl = slides_url;
        if (thumbnail_image_id !== undefined) updateData.thumbnailImageId = thumbnail_image_id;

        const [updated] = await tx
          .update(videos)
          .set(updateData)
          .where(eq(videos.videoId, videoId))
          .returning();

        return updated;
      });

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/videos/upload
   */
 async uploadVideo(req, res, next) {
  try {
    if (!req.file) {
      throw this.createError("No video file uploaded", 400);
    }

    const { title, description } = req.body;
    const uploadService = require('../upload/upload.service');

    try {
      this.validateRequired(title, "Video title");
      
      const fileData = uploadService.processFile(req.file, req, "videos");

      const [row] = await db
        .insert(videos)
        .values({
          title,
          description: description || null,
          slidesUrl: fileData.publicUrl,
          fileSize: req.file.size, // Add this
          mimeType: req.file.mimetype, // Add this
          thumbnailImageId: null,
          isArchived: false,
          createdAt: new Date(),
        })
        .returning({
          video_id: videos.videoId,
          title: videos.title,
          description: videos.description,
          slides_url: videos.slidesUrl,
          file_size: videos.fileSize,
          mime_type: videos.mimeType,
        });

      this.success(res, row, null, 201);
    } catch (error) {
      await uploadService.deleteFile(req.file.path);
      throw error;
    }
  } catch (error) {
    this.handleError(error, res, next);
  }
}

  /**
   * POST /api/videos/:videoId/archive
   */
  async archiveVideo(req, res, next) {
    try {
      const { videoId } = req.params;

      const result = await this.withTransaction(db, async (tx) => {
        const existing = await this.getOrThrow(tx, videos, videos.videoId, videoId, "Video");

        if (existing.isArchived) {
          throw this.createError("Video is already archived", 400);
        }

        const totalUsage = await this.checkMultipleUsage(tx, videoId, this.usageTables);
        if (totalUsage > 0) {
          throw this.createError("Cannot archive video that is currently in use", 400);
        }

        return await this.archive(tx, videos, videos.videoId, videoId, "Video");
      });

      this.success(res, result, "Video archived");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/videos/:videoId/restore
   */
  async restoreVideo(req, res, next) {
    try {
      const { videoId } = req.params;
      const updated = await this.restore(db, videos, videos.videoId, videoId, "Video");
      this.success(res, updated, "Video restored");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * DELETE /api/videos/:videoId
   */
  async deleteVideo(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const { videoId } = req.params;

        await this.getOrThrow(tx, videos, videos.videoId, videoId, "Video");

        const totalUsage = await this.checkMultipleUsage(tx, videoId, this.usageTables);
        if (totalUsage > 0) {
          throw this.createError("Cannot delete video that is being used. Remove all references first.", 400);
        }

        const now = Date.now();
        const purgeAt = new Date(now + TimeUntilDeletion);

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

      this.success(res, result, "Video scheduled for deletion in 60 seconds. Restore within a minute to cancel.");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * Helper to check multiple table usage
   */
  async checkMultipleUsage(tx, videoId, tables) {
    let totalUsage = 0;
    for (const { table, field } of tables) {
      const count = await this.checkRelatedCount(tx, table, field, videoId);
      totalUsage += count;
    }
    return totalUsage;
  }
}

module.exports = new VideoController();