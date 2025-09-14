// routes/api.js
const express = require("express");
const router = express.Router();

// --- Domain routers (note the paths are from /routes -> /domains) ---
const coursesRoutes = require("../domains/course/course.routes");
const instructorsRoutes = require("../domains/instructor/instructor.routes");
const imagesRoutes = require("../domains/media/image/image.routes");
const videosRoutes = require("../domains/media/video/video.routes");
const sectionsRoutes = require("../domains/section/section.routes");
const chaptersRoutes = require("../domains/chapter/chapter.routes");
const testsRoutes = require("../domains/test/test.routes");
const questionsRoutes = require("../domains/question/question.routes");
const optionsRoutes = require("../domains/option/option.routes");
const entriesRoutes = require("../domains/entry/entry.routes");
const archiveRoutes = require("../domains/archive/archive.routes");
const uploadsRoutes = require("../domains/media/upload");

// Optional: simple index to list top-level resources
router.get("/", (req, res) => {
  res.json({
    success: true,
    name: "I75 Educational Platform API",
    version: "1",
    resources: {
      courses: "/courses",
      instructors: "/instructors",
      images: "/images",
      videos: "/videos",
      sections: "/sections",
      chapters: "/chapters",
      tests: "/tests",
      questions: "/questions",
      options: "/options",
      entries: "/entries",
      archive: "/archive",
      uploads: "/uploads",
    },
  });
});

// Mount domain routers under /api/*
router.use("/courses", coursesRoutes);
router.use("/instructors", instructorsRoutes);
router.use("/images", imagesRoutes);
router.use("/videos", videosRoutes);
router.use("/sections", sectionsRoutes);
router.use("/chapters", chaptersRoutes);
router.use("/tests", testsRoutes);
router.use("/questions", questionsRoutes);
router.use("/options", optionsRoutes);
router.use("/entries", entriesRoutes);
router.use("/archive", archiveRoutes);
router.use("/uploads", uploadsRoutes);

module.exports = router;
