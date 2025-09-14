// ==================== routes/instructors.js (UPDATED) ====================
const express = require("express");
const router = express.Router();
const instructorController = require("../../controllers/api/instructorController");

// GET /api/instructors
router.get("/", instructorController.getAllInstructors);

// GET /api/instructors/:instructorId
router.get("/:instructorId", instructorController.getInstructorById);

// POST /api/instructors
router.post("/", instructorController.createInstructor);

// PUT /api/instructors/:instructorId
router.put("/:instructorId", instructorController.updateInstructor);

// DELETE /api/instructors/:instructorId
router.delete("/:instructorId", instructorController.deleteInstructor);

// GET /api/instructors/:instructorId/courses
router.get("/:instructorId/courses", instructorController.getInstructorCourses);

module.exports = router;
