// ==================== routes/options.js ====================
const express = require("express");
const router = express.Router();
const optionController = require("../../controllers/api/optionController");

// CRUD Routes for Options
// GET /api/options
router.get("/", optionController.getAllOptions);

// GET /api/options/:optionId
router.get("/:optionId", optionController.getOptionById);

// POST /api/options
router.post("/", optionController.createOption);

// PUT /api/options/:optionId
router.put("/:optionId", optionController.updateOption);

// DELETE /api/options/:optionId
router.delete("/:optionId", optionController.deleteOption);

// Hierarchical Routes - Images for an Option
// GET /api/options/:optionId/images
router.get("/:optionId/images", optionController.getOptionImages);

// Hierarchical Routes - Videos for an Option
// GET /api/options/:optionId/videos
router.get("/:optionId/videos", optionController.getOptionVideos);

module.exports = router;
