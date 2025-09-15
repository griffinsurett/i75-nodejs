// ==================== domains/media/video/video.routes.js ====================
const express = require("express");
const router = express.Router();
const videoController = require("./video.controller");
const videoUploadMiddleware = require("./video.upload");

// CRUD Routes
router.get("/", videoController.getAllVideos);
router.get("/:videoId", videoController.getVideoById);
router.post("/", videoController.createVideo);
router.put("/:videoId", videoController.updateVideo);

// Upload route
router.post("/upload", videoUploadMiddleware, videoController.uploadVideo);

// Archive operations
router.post("/:videoId/archive", videoController.archiveVideo);
router.post("/:videoId/restore", videoController.restoreVideo);

// Safety delete (schedule purge in 60s)
router.delete("/:videoId", videoController.deleteVideo);

module.exports = router;