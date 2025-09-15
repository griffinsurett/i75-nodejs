// ==================== domains/media/image/image.controller.js ====================
const { db } = require("../../../config/database");
const imageService = require('./image.service');

const imageController = {
  getAllImages: async (req, res, next) => {
    try {
      const result = await db.transaction(async (tx) => {
        return await imageService.getAllImages(tx);
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

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

  deleteImage: async (req, res, next) => {
    try {
      const { imageId } = req.params;

      const result = await db.transaction(async (tx) => {
        return await imageService.deleteImage(tx, imageId);
      });

      res.json({
        success: true,
        message: "Image deleted successfully",
        data: result,
      });
    } catch (error) {
      if (error.status && error.status !== 500) {
        return res.status(error.status).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

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
};

module.exports = imageController;