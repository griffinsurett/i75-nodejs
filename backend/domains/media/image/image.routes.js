// ==================== domains/media/image/image.routes.js ====================
const express = require("express");
const router = express.Router();
const imageController = require("./image.controller");
const imageUploadMiddleware = require("./image.upload");

// CRUD Routes
router.get("/", imageController.getAllImages);
router.get("/:imageId", imageController.getImageById);
router.post("/", imageController.createImage);
router.put("/:imageId", imageController.updateImage);
router.post("/bulk", imageController.bulkCreateImages);

// Upload route (new)
router.post("/upload", imageUploadMiddleware, imageController.uploadImage);

// Archive operations
router.post("/:imageId/archive", imageController.archiveImage);
router.post("/:imageId/restore", imageController.restoreImage);

// Safety delete (schedule purge in 60s)
router.delete("/:imageId", imageController.deleteImage);

module.exports = router;