// ==================== routes/tests.js ====================
const express = require("express");
const router = express.Router();
const testController = require("../../controllers/api/test.controller");
const questionController = require("../../controllers/api/question.controller");

// CRUD Routes for Tests
// GET /api/tests
router.get("/", testController.getAllTests);

// GET /api/tests/:testId
router.get("/:testId", testController.getTestById);

// POST /api/tests
router.post("/", testController.createTest);

// PUT /api/tests/:testId
router.put("/:testId", testController.updateTest);

// DELETE /api/tests/:testId
router.delete("/:testId", testController.deleteTest);

// Hierarchical Routes - Questions for a Test
// GET /api/tests/:testId/questions
router.get("/:testId/questions", testController.getTestQuestions);

module.exports = router;
