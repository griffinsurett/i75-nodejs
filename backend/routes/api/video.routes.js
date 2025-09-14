// ==================== routes/videos.js (NEW) ====================
const express = require("express");
const router = express.Router();
const videoController = require("../../controllers/api/video.controller");

// GET /api/videos
router.get("/", videoController.getAllVideos);

// GET /api/videos/:videoId
router.get("/:videoId", videoController.getVideoById);

// POST /api/videos
router.post("/", videoController.createVideo);

// PUT /api/videos/:videoId
router.put("/:videoId", videoController.updateVideo);

// DELETE /api/videos/:videoId
router.delete("/:videoId", videoController.deleteVideo);

module.exports = router;
