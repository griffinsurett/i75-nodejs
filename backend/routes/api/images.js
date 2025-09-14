// ==================== routes/images.js ====================
const express = require("express");
const router = express.Router();
const imageController = require("../../controllers/api/imageController");

// CRUD Routes for Images
// GET /api/images
router.get("/", imageController.getAllImages);

// GET /api/images/:imageId
router.get("/:imageId", imageController.getImageById);

// POST /api/images
router.post("/", imageController.createImage);

// PUT /api/images/:imageId
router.put("/:imageId", imageController.updateImage);

// DELETE /api/images/:imageId
router.delete("/:imageId", imageController.deleteImage);

// Special Routes for Images
// GET /api/images/:imageId/usage - Get detailed usage information
router.get("/:imageId/usage", imageController.getImageUsage);

// POST /api/images/bulk - Bulk upload multiple images
router.post("/bulk", imageController.bulkCreateImages);

module.exports = router;
