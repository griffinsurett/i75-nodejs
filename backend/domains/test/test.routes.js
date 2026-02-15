// backend/domains/test/test.routes.js
const express = require("express");
const router = express.Router();
const testController = require("./test.controller");

// CRUD Routes for Tests
router.get("/", testController.getAllTests);
router.get("/:testId", testController.getTestById);
router.get("/:testId/questions", testController.getTestQuestions);
router.post("/", testController.createTest);
router.put("/:testId", testController.updateTest);

// Archive operations
router.post("/:testId/archive", testController.archiveTest);
router.post("/:testId/restore", testController.restoreTest);

// Safety delete (schedule purge in 60s)
router.delete("/:testId", testController.deleteTest);

module.exports = router;
