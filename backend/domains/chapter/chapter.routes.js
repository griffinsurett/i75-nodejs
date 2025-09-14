// ==================== routes/chapters.js ====================
const express = require("express");
const router = express.Router();
const chapterController = require("./chapter.controller");
const testController = require("../test/test.controller");

// CRUD Routes for Chapters
// GET /api/chapters
router.get("/", chapterController.getAllChapters);

// GET /api/chapters/:chapterId
router.get("/:chapterId", chapterController.getChapterById);

// POST /api/chapters
router.post("/", chapterController.createChapter);

// PUT /api/chapters/:chapterId
router.put("/:chapterId", chapterController.updateChapter);

// DELETE /api/chapters/:chapterId
router.delete("/:chapterId", chapterController.deleteChapter);

// Hierarchical Routes - Tests for a Chapter
// GET /api/chapters/:chapterId/tests
router.get("/:chapterId/tests", chapterController.getChapterTests);

// Hierarchical Routes - Entries for a Chapter
// GET /api/chapters/:chapterId/entries
router.get("/:chapterId/entries", chapterController.getChapterEntries);

module.exports = router;
