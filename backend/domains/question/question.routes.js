// backend/domains/question/question.routes.js
const express = require("express");
const router = express.Router();
const questionController = require("./question.controller");

// CRUD Routes for Questions
router.get("/", questionController.getAllQuestions);
router.get("/:questionId", questionController.getQuestionById);
router.get("/:questionId/options", questionController.getQuestionOptions);
router.get("/:questionId/images", questionController.getQuestionImages);
router.get("/:questionId/videos", questionController.getQuestionVideos);
router.post("/", questionController.createQuestion);
router.put("/:questionId", questionController.updateQuestion);

// Archive operations
router.post("/:questionId/archive", questionController.archiveQuestion);
router.post("/:questionId/restore", questionController.restoreQuestion);

// Safety delete (schedule purge in 60s)
router.delete("/:questionId", questionController.deleteQuestion);

module.exports = router;
