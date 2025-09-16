// backend/server.js
const express = require("express");
require("dotenv").config();

const { setupMiddleware, setupErrorHandler } = require("./shared/middleware");
const serverLifecycle = require("./shared/utils/serverLifecycle");

const app = express();
const PORT = process.env.PORT || 3000;

// Setup middleware
setupMiddleware(app);

// Routes
const healthRoutes = require("./routes/health");
const apiRouter = require("./routes/api");
const notFoundRoute = require("./routes/notFound");

app.use("/health", healthRoutes);
app.use("/api", apiRouter);
app.use(notFoundRoute);

// Error handler
setupErrorHandler(app);

// Start server
app.listen(PORT, () => {
  console.log(`I75 Educational Platform API - Powered by Drizzle ORM`);
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`API Docs: http://localhost:${PORT}/api`); 
  console.log(`Health: http://localhost:${PORT}/health`);
  
  // Initialize background jobs and shutdown handlers
  serverLifecycle.initialize();
});