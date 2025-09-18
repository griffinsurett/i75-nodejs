// backend/domains/media/image/image.controller.js
const { db } = require("../../../config/database");
const imageService = require('./image.service');
const { images, courses, sections, chapters, tests, instructors, videos } = require("../../../config/schema");
const { eq } = require("drizzle-orm");
const BaseController = require("../../../shared/utils/baseController");

const TimeUntilDeletion = 60000;

class ImageController extends BaseController {
  // Define usage tables for checking
  get usageTables() {
    return [
      { table: courses, field: courses.imageId },
      { table: sections, field: sections.imageId },
      { table: chapters, field: chapters.imageId },
      { table: tests, field: tests.imageId },
      { table: instructors, field: instructors.imageId },
      { table: videos, field: videos.imageId },
    ];
  }

  /**
   * GET /api/images
   */
  async getAllImages(req, res, next) {
    try {
      const showArchived = String(req.query.archived || "").toLowerCase() === "true";
      
      const result = await this.withTransaction(db, async (tx) => {
        return await imageService.getAllImages(tx, showArchived);
      });

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/images/:imageId
   */
  async getImageById(req, res, next) {
    try {
      const { imageId } = req.params;

      const result = await this.withTransaction(db, async (tx) => {
        return await imageService.getImageById(tx, imageId);
      });

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/images
   */
  async createImage(req, res, next) {
    try {
      const { imageUrl, altText } = req.body;

      const result = await this.withTransaction(db, async (tx) => {
        return await imageService.createImage(tx, { imageUrl, altText });
      });

      this.success(res, result, null, 201);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * PUT /api/images/:imageId
   */
  async updateImage(req, res, next) {
    try {
      const { imageId } = req.params;
      const { imageUrl, altText } = req.body;

      const result = await this.withTransaction(db, async (tx) => {
        return await imageService.updateImage(tx, imageId, { imageUrl, altText });
      });

      this.success(res, result);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/images/bulk
   */
  async bulkCreateImages(req, res, next) {
    try {
      const result = await this.withTransaction(db, async (tx) => {
        const { images: imageData } = req.body;

        if (!imageData || !Array.isArray(imageData) || imageData.length === 0) {
          throw this.createError("Images array is required and must not be empty", 400);
        }

        const results = [];
        for (const imageItem of imageData) {
          const { imageUrl, altText } = imageItem;
          const result = await imageService.createImage(tx, { imageUrl, altText });
          results.push(result);
        }

        return results;
      });

      this.success(res, result, `Successfully created ${result.length} images`, 201);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/images/upload
   */
  async uploadImage(req, res, next) {
    try {
      if (!req.file) {
        throw this.createError("No image file uploaded", 400);
      }

      const altText = req.body?.alt_text || req.body?.altText || null;
      const uploadService = require('../upload/upload.service');
      
      const fileData = uploadService.processFile(req.file, req, "images");

      const [row] = await db
        .insert(images)
        .values({
          imageUrl: fileData.publicUrl,
          altText: altText,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          isArchived: false,
          createdAt: new Date(),
        })
        .returning();

      this.success(res, row, null, 201);
    } catch (error) {
      if (req.file) {
        const uploadService = require('../upload/upload.service');
        await uploadService.deleteFile(req.file.path);
      }
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/images/:imageId/archive
   */
  async archiveImage(req, res, next) {
    try {
      const { imageId } = req.params;

      const result = await this.withTransaction(db, async (tx) => {
        const existing = await this.getOrThrow(tx, images, images.imageId, imageId, "Image");

        if (existing.isArchived) {
          throw this.createError("Image is already archived", 400);
        }

        const canArchive = await imageService.canDeleteFromDomain(imageId, this.usageTables, tx);
        if (!canArchive) {
          throw this.createError("Cannot archive image that is currently in use", 400);
        }

        return await this.archive(tx, images, images.imageId, imageId, "Image");
      });

      this.success(res, result, "Image archived");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/images/:imageId/restore
   */
  async restoreImage(req, res, next) {
    try {
      const { imageId } = req.params;
      const updated = await this.restore(db, images, images.imageId, imageId, "Image");
      this.success(res, updated, "Image restored");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * DELETE /api/images/:imageId
   */
  async deleteImage(req, res, next) {
    try {
      const { imageId } = req.params;

      const result = await this.withTransaction(db, async (tx) => {
        const existing = await this.getOrThrow(tx, images, images.imageId, imageId, "Image");

        const canDelete = await imageService.canDeleteFromDomain(imageId, this.usageTables, tx);
        if (!canDelete) {
          throw this.createError("Cannot delete image that is being used. Remove all references first.", 400);
        }

        const now = Date.now();
        const purgeAt = new Date(now + TimeUntilDeletion);

        const [updated] = await tx
          .update(images)
          .set({
            isArchived: true,
            archivedAt: new Date(now),
            purgeAfterAt: purgeAt,
            updatedAt: new Date(now),
          })
          .where(eq(images.imageId, imageId))
          .returning();

        return updated;
      });

      this.success(res, result, "Image scheduled for deletion in 60 seconds. Restore within a minute to cancel.");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }
}

module.exports = new ImageController();