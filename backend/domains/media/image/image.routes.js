// ==================== domains/media/image/image.routes.js ====================
const express = require("express");
const router = express.Router();
const imageController = require("./image.controller");

// Pure CRUD Routes for Images
router.get("/", imageController.getAllImages);
router.get("/:imageId", imageController.getImageById);
router.post("/", imageController.createImage);
router.put("/:imageId", imageController.updateImage);
router.delete("/:imageId", imageController.deleteImage);
router.post("/bulk", imageController.bulkCreateImages);

module.exports = router;