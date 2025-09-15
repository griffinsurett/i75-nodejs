// ==================== domains/media/image/image.controller.js ====================
const { db } = require("../../../config/database");
const imageService = require('./image.service');
const { images, courses, sections, chapters, tests, instructors, videos } = require("../../../config/schema");
const { eq, count } = require("drizzle-orm");

const ONE_MINUTE_MS = 60 * 1000;

const imageController = {
  /**
   * GET /api/images - Get all images with optional archive filter
   */
  getAllImages: async (req, res, next) => {
    try {
      const showArchived = String(req.query.archived || "").toLowerCase() === "true";
      
      const result = await db.transaction(async (tx) => {
        return await imageService.getAllImages(tx, showArchived);
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/images/:imageId - Get single image by ID
   */
  getImageById: async (req, res, next) => {
    try {
      const { imageId } = req.params;

      const result = await db.transaction(async (tx) => {
        return await imageService.getImageById(tx, imageId);
      });

      res.json({ success: true, data: result });
    } catch (error) {
      if (error.status && error.status !== 500) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  /**
   * POST /api/images - Create new image
   */
  createImage: async (req, res, next) => {
    try {
      const { image_url, alt_text } = req.body;

      const result = await db.transaction(async (tx) => {
        return await imageService.createImage(tx, { image_url, alt_text });
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      if (error.status && error.status !== 500) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  /**
   * PUT /api/images/:imageId - Update existing image
   */
  updateImage: async (req, res, next) => {
    try {
      const { imageId } = req.params;
      const { image_url, alt_text } = req.body;

      const result = await db.transaction(async (tx) => {
        return await imageService.updateImage(tx, imageId, { image_url, alt_text });
      });

      res.json({ success: true, data: result });
    } catch (error) {
      if (error.status && error.status !== 500) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  /**
   * POST /api/images/bulk - Bulk create images
   */
  bulkCreateImages: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        const { images: imageData } = req.body;

        if (!imageData || !Array.isArray(imageData) || imageData.length === 0) {
          throw imageService.createError("Images array is required and must not be empty", 400);
        }

        const results = [];

        for (const imageItem of imageData) {
          const { image_url, alt_text } = imageItem;
          const result = await imageService.createImage(tx, { image_url, alt_text });
          results.push(result);
        }

        return results;
      });

      res.status(201).json({
        success: true,
        message: `Successfully created ${result.length} images`,
        data: result,
      });
    } catch (error) {
      if (error.status && error.status !== 500) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  /**
   * POST /api/images/upload - Upload image file
   */
  uploadImage: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file uploaded",
        });
      }

      const alt_text = req.body?.alt_text || null;
      const uploadService = require('../upload/upload.service');
      
      // Process file metadata
      const fileData = uploadService.processFile(req.file, req, "images");

      // Save to database
      const [row] = await db
        .insert(images)
        .values({
          imageUrl: fileData.publicUrl,
          altText: alt_text,
          isArchived: false,
          createdAt: new Date(),
        })
        .returning({
          image_id: images.imageId,
          image_url: images.imageUrl,
          alt_text: images.altText,
        });

      res.status(201).json({ success: true, data: row });
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
   * POST /api/images/:imageId/archive - Archive image indefinitely
   */
  archiveImage: async (req, res, next) => {
    try {
      const { imageId } = req.params;

      const result = await db.transaction(async (tx) => {
        // Check if image exists
        const existing = await tx
          .select()
          .from(images)
          .where(eq(images.imageId, imageId));

        if (existing.length === 0) {
          throw imageService.createError("Image not found", 404);
        }

        // Check if already archived
        if (existing[0].isArchived) {
          throw imageService.createError("Image is already archived", 400);
        }

        // Check usage before archiving
        const canArchive = await imageService.canDeleteFromDomain(
          imageId,
          [
            { table: courses, field: courses.imageId },
            { table: sections, field: sections.imageId },
            { table: chapters, field: chapters.imageId },
            { table: tests, field: tests.imageId },
            { table: instructors, field: instructors.imageId },
            { table: videos, field: videos.thumbnailImageId },
          ],
          tx
        );

        if (!canArchive) {
          throw imageService.createError(
            "Cannot archive image that is currently in use",
            400
          );
        }

        const [updated] = await tx
          .update(images)
          .set({
            isArchived: true,
            archivedAt: new Date(),
            purgeAfterAt: null,
            updatedAt: new Date(),
          })
          .where(eq(images.imageId, imageId))
          .returning();

        return updated;
      });

      res.json({ success: true, data: result, message: "Image archived" });
    } catch (error) {
      if (error.status && error.status !== 500) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  /**
   * POST /api/images/:imageId/restore - Restore archived image
   */
  restoreImage: async (req, res, next) => {
    try {
      const { imageId } = req.params;

      const result = await db.transaction(async (tx) => {
        const existing = await tx
          .select()
          .from(images)
          .where(eq(images.imageId, imageId));

        if (existing.length === 0) {
          throw imageService.createError("Image not found", 404);
        }

        if (!existing[0].isArchived) {
          throw imageService.createError("Image is not archived", 400);
        }

        const [updated] = await tx
          .update(images)
          .set({
            isArchived: false,
            archivedAt: null,
            purgeAfterAt: null,
            updatedAt: new Date(),
          })
          .where(eq(images.imageId, imageId))
          .returning();

        return updated;
      });

      res.json({ success: true, data: result, message: "Image restored" });
    } catch (error) {
      if (error.status && error.status !== 500) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  /**
   * DELETE /api/images/:imageId - Schedule image for deletion (safety delete)
   */
  deleteImage: async (req, res, next) => {
    try {
      const { imageId } = req.params;

      const result = await db.transaction(async (tx) => {
        // Check if image exists
        const existing = await tx
          .select()
          .from(images)
          .where(eq(images.imageId, imageId));

        if (existing.length === 0) {
          throw imageService.createError("Image not found", 404);
        }

        // Check if image is in use
        const canDelete = await imageService.canDeleteFromDomain(
          imageId,
          [
            { table: courses, field: courses.imageId },
            { table: sections, field: sections.imageId },
            { table: chapters, field: chapters.imageId },
            { table: tests, field: tests.imageId },
            { table: instructors, field: instructors.imageId },
            { table: videos, field: videos.thumbnailImageId },
          ],
          tx
        );

        if (!canDelete) {
          throw imageService.createError(
            "Cannot delete image that is being used. Remove all references first.",
            400
          );
        }

        // Schedule for deletion (archive with timer)
        const now = Date.now();
        const purgeAt = new Date(now + ONE_MINUTE_MS);

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

      res.json({
        success: true,
        message: "Image scheduled for deletion in 60 seconds (archived now). Restore within a minute to cancel.",
        data: result,
      });
    } catch (error) {
      if (error.status && error.status !== 500) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      next(error);
    }
  },
};

module.exports = imageController;