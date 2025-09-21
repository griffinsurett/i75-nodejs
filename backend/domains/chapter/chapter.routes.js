// ==================== routes/chapters.js ====================
const express = require("express");
const router = express.Router();
const chapterController = require("./chapter.controller");

// CRUD Routes for Chapters
router.get("/", chapterController.getAllChapters);
router.get("/:chapterId", chapterController.getChapterById);
router.get("/:chapterId/tests", chapterController.getChapterTests);
router.get("/:chapterId/entries", chapterController.getChapterEntries);
router.post("/", chapterController.createChapter);
router.put("/:chapterId", chapterController.updateChapter);

// Reorder chapters in a section
router.put("/sections/:sectionId/reorder", chapterController.reorderChapters);

// Archive operations
router.post("/:chapterId/archive", chapterController.archiveChapter);
router.post("/:chapterId/restore", chapterController.restoreChapter);

// Safety delete (schedule purge in 60s)
router.delete("/:chapterId", chapterController.deleteChapter);

module.exports = router;