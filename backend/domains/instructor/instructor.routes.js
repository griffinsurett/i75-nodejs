// ==================== routes/instructors.js (UPDATED) ====================
const express = require("express");
const router = express.Router();
const instructorController = require("./instructor.controller");

// CRUD Routes
router.get("/", instructorController.getAllInstructors);
router.get("/:instructorId", instructorController.getInstructorById);
router.post("/", instructorController.createInstructor);
router.put("/:instructorId", instructorController.updateInstructor);

// Archive operations
router.post("/:instructorId/archive", instructorController.archiveInstructor);
router.post("/:instructorId/restore", instructorController.restoreInstructor);

// Safety delete (schedule purge in 60s)
router.delete("/:instructorId", instructorController.deleteInstructor);

// Relationship management
router.get("/:instructorId/courses", instructorController.getInstructorCourses);
router.post("/:instructorId/courses", instructorController.assignCourses);

module.exports = router;