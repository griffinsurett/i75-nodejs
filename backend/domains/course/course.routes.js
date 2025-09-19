// backend/domains/course/course.routes.js
const express = require("express");
const router = express.Router();
const courseController = require("./course.controller");

router.get("/", courseController.getAllCourses);
router.get("/:courseId", courseController.getCourseById);
router.get("/:courseId/sections", courseController.getCourseSections);
router.post("/", courseController.createCourse);
router.put("/:courseId", courseController.updateCourse);

// Section management within course
router.post("/:courseId/sections", courseController.createCourseSection);
router.put("/:courseId/sections/:sectionId", courseController.updateCourseSection);
router.delete("/:courseId/sections/:sectionId", courseController.deleteCourseSection);

// Archive operations
router.post("/:courseId/archive", courseController.archiveCourse);
router.post("/:courseId/restore", courseController.restoreCourse);

// Safety delete (schedule purge in 60s)
router.delete("/:courseId", courseController.deleteCourse);

module.exports = router;