// backend/domains/option/option.routes.js
const express = require("express");
const router = express.Router();
const optionController = require("./option.controller");

// CRUD Routes for Options
router.get("/", optionController.getAllOptions);
router.get("/:optionId", optionController.getOptionById);
router.get("/:optionId/images", optionController.getOptionImages);
router.get("/:optionId/videos", optionController.getOptionVideos);
router.post("/", optionController.createOption);
router.put("/:optionId", optionController.updateOption);

// Archive operations
router.post("/:optionId/archive", optionController.archiveOption);
router.post("/:optionId/restore", optionController.restoreOption);

// Safety delete (schedule purge in 60s)
router.delete("/:optionId", optionController.deleteOption);

module.exports = router;
