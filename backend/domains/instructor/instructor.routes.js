// backend/domains/instructor/instructor.routes.js
const express = require("express");
const router = express.Router();
const instructorController = require("./instructor.controller");

router.get("/", instructorController.getAllInstructors);
router.get("/:instructorId", instructorController.getInstructor);
router.get("/:instructorId/courses", instructorController.getInstructorCourses);
router.post("/", instructorController.createInstructor);
router.put("/:instructorId", instructorController.updateInstructor);

// Archive operations
router.post("/:instructorId/archive", instructorController.archiveInstructor);
router.post("/:instructorId/restore", instructorController.restoreInstructor);

// Safety delete (schedule purge in 60s)
router.delete("/:instructorId", instructorController.deleteInstructor);

module.exports = router;
