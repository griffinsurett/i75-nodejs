// ==================== server.js (FIXED) ====================
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { pool } = require("./config/database");
const errorHandler = require("./shared/middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Static uploads
const uploadRoot = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(path.join(uploadRoot, "images"), { recursive: true });
app.use("/uploads", express.static(uploadRoot));

// Middleware (MUST come before routes)
app.use(helmet());
app.use(cors());
app.use(limiter);

// FIXED: Configure body parsers to skip multipart requests (for multer)
app.use(
  express.json({
    limit: "10mb",
    // Skip requests with multipart content-type for multer to handle
    type: ["application/json", "text/*"],
  })
);

app.use(
  express.urlencoded({
    extended: true,
    // Skip multipart requests for multer
    type: ["application/x-www-form-urlencoded"],
  })
);

// Import routes
const healthRoutes = require("./routes/health");
const coursesRoutes = require("./routes/api/course.routes");
const instructorsRoutes = require("./routes/api/instructor.routes");
const videosRoutes = require("./routes/api/video.routes");
const sectionsRoutes = require("./routes/api/section.routes");
const chaptersRoutes = require("./routes/api/chapter.routes");
const testsRoutes = require("./routes/api/test.routes");
const questionsRoutes = require("./routes/api/question.routes");
const optionsRoutes = require("./routes/api/option.routes");
const entriesRoutes = require("./routes/api/entry.routes");
const imagesRoutes = require("./routes/api/image.routes");
const archiveRoutes = require("./routes/api/archive.routes");

const uploadsRoutes = require("./routes/api/upload.routes");

const { purgeExpiredSnapshots } = require("./shared/workers/archivePurger");

// Health routes
app.use("/health", healthRoutes);

// API Routes
app.use("/api/courses", coursesRoutes);
app.use("/api/instructors", instructorsRoutes);
app.use("/api/images", imagesRoutes);
app.use("/api/videos", videosRoutes);
app.use("/api/sections", sectionsRoutes);
app.use("/api/chapters", chaptersRoutes);
app.use("/api/tests", testsRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/options", optionsRoutes);
app.use("/api/entries", entriesRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/archive", archiveRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    tip: "Visit /api for available endpoints",
  });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`I75 Educational Platform API - Powered by Drizzle ORM`);
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`API Docs: http://localhost:${PORT}/api`);
  console.log(`Health: http://localhost:${PORT}/health`);
});

// Simple purge scheduler (every 15s)
const PURGE_INTERVAL_MS = Number(
  process.env.ARCHIVE_PURGE_INTERVAL_MS || 15000
);
setInterval(() => {
  purgeExpiredSnapshots().catch((e) =>
    console.error("Archive purge error:", e)
  );
}, PURGE_INTERVAL_MS);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await pool.end();
  process.exit(0);
});
