// routes/notFound.js
const express = require("express");
const router = express.Router();

/**
 * Catch-all 404 handler for any route not matched earlier.
 * Placed AFTER all other routers & static middleware.
 */
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    method: req.method,
    path: req.originalUrl,
    tip: "Visit /api for available endpoints",
  });
});

module.exports = router;
