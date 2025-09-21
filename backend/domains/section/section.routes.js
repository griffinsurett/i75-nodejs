const express = require("express");
const router = express.Router();
const sectionController = require("./section.controller");

// Standalone section routes
router.get("/", sectionController.getAllSections);
router.get("/:sectionId", sectionController.getSection);
router.get("/:sectionId/chapters", sectionController.getSectionChapters);

// Create and Update routes (ADD THESE)
router.post("/", sectionController.createSection);
router.put("/:sectionId", sectionController.updateSection);

// Archive operations
router.post("/:sectionId/archive", sectionController.archiveSection);
router.post("/:sectionId/restore", sectionController.restoreSection);

// Safety delete
router.delete("/:sectionId", sectionController.deleteSection);

router.post("/:sectionId/chapters", sectionController.createSectionChapter);
router.put("/:sectionId/chapters/:chapterId", sectionController.updateSectionChapter);
router.delete("/:sectionId/chapters/:chapterId", sectionController.deleteSectionChapter);

module.exports = router;