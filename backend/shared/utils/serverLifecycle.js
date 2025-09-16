// backend/shared/utils/serverLifecycle.js
const { pool } = require("../../config/database");
const { purgeExpiredSnapshots } = require("../workers/archivePurger");

class ServerLifecycle {
  constructor() {
    this.intervals = [];
  }

  startBackgroundJobs() {
    // Archive purger
    const PURGE_INTERVAL_MS = Number(process.env.ARCHIVE_PURGE_INTERVAL_MS || 15000);
    const purgeInterval = setInterval(() => {
      purgeExpiredSnapshots().catch((e) => console.error("Archive purge error:", e));
    }, PURGE_INTERVAL_MS);
    
    this.intervals.push(purgeInterval);
    console.log(`[Background] Archive purger started (every ${PURGE_INTERVAL_MS}ms)`);
    
    // Add other background jobs here as needed
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      // Clear all intervals
      this.intervals.forEach(interval => clearInterval(interval));
      console.log("[Shutdown] Background jobs stopped");
      
      // Close database connection
      await pool.end();
      console.log("[Shutdown] Database connections closed");
      
      // Add other cleanup here (Redis, message queues, etc.)
      
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