// ==================== server.js (UPDATED) ====================
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
  windowMs: 15 * 60 * 1000,
  max: 100,
});

// Static uploads (public files at /uploads/*)
const uploadRoot = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(path.join(uploadRoot, "images"), { recursive: true });
app.use("/uploads", express.static(uploadRoot));

// Middleware
app.use(helmet());
app.use(cors());
app.use(limiter);

// Body parsers (skip multipart for multer routes)
app.use(
  express.json({
    limit: "10mb",
    type: ["application/json", "text/*"],
  })
);
app.use(
  express.urlencoded({
    extended: true,
    type: ["application/x-www-form-urlencoded"],
  })
);

// Routes
const healthRoutes = require("./routes/health");
const apiRouter = require("./routes/api"); // <-- NEW aggregator
const notFoundRoute = require("./routes/notFound"); // <-- NEW

app.use("/health", healthRoutes);
app.use("/api", apiRouter); // <-- all API lives here now

// 404 handler (as a route, after all other routes & static)
app.use(notFoundRoute);

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
const { purgeExpiredSnapshots } = require("./shared/workers/archivePurger");
const PURGE_INTERVAL_MS = Number(process.env.ARCHIVE_PURGE_INTERVAL_MS || 15000);
setInterval(() => {
  purgeExpiredSnapshots().catch((e) => console.error("Archive purge error:", e));
}, PURGE_INTERVAL_MS);

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await pool.end();
  process.exit(0);
});