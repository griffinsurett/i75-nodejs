// backend/shared/utils/serverLifecycle.js
const { pool } = require("../../config/database");
const { purgeExpiredSnapshots, clearAllTimers } = require("../workers/archivePurger");

class ServerLifecycle {
  startBackgroundJobs() {
    // Run a single purge on startup to clean up any records
    // that expired while the server was down.
    purgeExpiredSnapshots().catch((e) => console.error("Startup purge error:", e));
    console.log("[Background] Startup purge complete. Purger runs on-demand only.");
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      // Clear any scheduled purge timers
      clearAllTimers();
      console.log("[Shutdown] Purge timers cleared");

      // Close database connection
      await pool.end();
      console.log("[Shutdown] Database connections closed");

      console.log("[Shutdown] Graceful shutdown complete");
      process.exit(0);
    };

    // Handle different termination signals
    process.on("SIGINT", () => shutdown("SIGINT"));   // Ctrl+C
    process.on("SIGTERM", () => shutdown("SIGTERM")); // Docker/K8s stop
    process.on("SIGHUP", () => shutdown("SIGHUP"));   // Terminal closed

    // Handle uncaught errors
    process.on("uncaughtException", (error) => {
      console.error("[FATAL] Uncaught Exception:", error);
      shutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason, promise) => {
      console.error("[FATAL] Unhandled Promise Rejection:", reason);
      shutdown("unhandledRejection");
    });
  }

  initialize() {
    this.startBackgroundJobs();
    this.setupGracefulShutdown();
  }
}

module.exports = new ServerLifecycle();
