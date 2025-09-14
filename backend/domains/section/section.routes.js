// ==================== routes/sections.js ====================
const express = require("express");
const router = express.Router();
const sectionController = require("./section.controller");

// GET /api/sections
router.get("/", sectionController.getAllSections);

// GET /api/sections/:sectionId
router.get("/:sectionId", sectionController.getSectionById);

// POST /api/sections
router.post("/", sectionController.createSection);

// PUT /api/sections/:sectionId
router.put("/:sectionId", sectionController.updateSection);

// DELETE /api/sections/:sectionId
router.delete("/:sectionId", sectionController.deleteSection);

router.get("/:sectionId/chapters", sectionController.getSectionChapters);

module.exports = router;
