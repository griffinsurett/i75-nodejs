// ==================== routes/questions.js ====================
const express = require("express");
const router = express.Router();
const questionController = require("./question.controller");
// const optionController = require("../option/option.controller");

// CRUD Routes for Questions
// GET /api/questions
router.get("/", questionController.getAllQuestions);

// GET /api/questions/:questionId
router.get("/:questionId", questionController.getQuestionById);

// POST /api/questions
router.post("/", questionController.createQuestion);

// PUT /api/questions/:questionId
router.put("/:questionId", questionController.updateQuestion);

// DELETE /api/questions/:questionId
router.delete("/:questionId", questionController.deleteQuestion);

// Hierarchical Routes - Options for a Question
// GET /api/questions/:questionId/options
router.get("/:questionId/options", questionController.getQuestionOptions);

// Hierarchical Routes - Images for a Question
// GET /api/questions/:questionId/images
router.get("/:questionId/images", questionController.getQuestionImages);

// Hierarchical Routes - Videos for a Question
// GET /api/questions/:questionId/videos
router.get("/:questionId/videos", questionController.getQuestionVideos);

module.exports = router;
