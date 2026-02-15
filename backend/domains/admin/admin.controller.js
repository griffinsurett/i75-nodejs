// backend/domains/admin/admin.controller.js
const { db } = require("../../config/database");
const { sql } = require("drizzle-orm");
const BaseController = require("../../shared/utils/baseController");
const { purgeExpiredSnapshots, schedulePurge } = require("../../shared/workers/archivePurger");

const DEFAULT_COUNTDOWN_MS = Number(process.env.DELETE_COUNTDOWN_MS || 60000);

class AdminController extends BaseController {
  /**
   * POST /api/admin/purge - Purge archived items older than retention period.
   * Body: { retention_days?: number } (defaults to ARCHIVE_RETENTION_DAYS env or 30)
   * Marks old archived items for immediate purge, then runs the purger.
   */
  async purgeRecentlyDeleted(req, res, next) {
    try {
      const DEFAULT_RETENTION_DAYS = Number(process.env.ARCHIVE_RETENTION_DAYS || 30);
      const retentionDays = Number(req.body.retention_days) || DEFAULT_RETENTION_DAYS;

      // Find all tables with archive columns and mark old items for immediate purge
      const tablesQuery = sql`
        SELECT DISTINCT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND column_name IN ('is_archived', 'purge_after_at', 'archived_at')
        GROUP BY table_name
        HAVING COUNT(DISTINCT column_name) = 3
      `;
      const tablesResult = await db.execute(tablesQuery);

      for (const { table_name } of tablesResult.rows) {
        const markQuery = sql.raw(`
          UPDATE "${table_name}"
          SET "purge_after_at" = now(), "updated_at" = now()
          WHERE "is_archived" = true AND "purge_after_at" IS NULL
            AND "archived_at" <= now() - interval '${retentionDays} days'
        `);
        await db.execute(markQuery);
      }

      // Run the purger now to hard-delete them
      await purgeExpiredSnapshots();

      this.success(
        res,
        null,
        `Purged archived items older than ${retentionDays} day(s).`
      );
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * DELETE /api/admin/purge/:entityType/:id - Delete from "recently deleted" with countdown.
   * Sets purge_after_at so the background purger hard-deletes after the timer expires.
   * Body: { immediate?: boolean } — if true, hard-deletes right now (no countdown).
   */
  async deleteFromRecentlyDeleted(req, res, next) {
    try {
      const { entityType, id } = req.params;
      const { immediate } = req.body || {};

      const allowedTables = {
        courses: "course_id",
        sections: "section_id",
        chapters: "chapter_id",
        instructors: "instructor_id",
        images: "image_id",
        videos: "video_id",
        tests: "test_id",
        entries: "entry_id",
      };

      const idColumn = allowedTables[entityType];
      if (!idColumn) {
        throw this.createError(
          `Unsupported entity type: ${entityType}. Allowed: ${Object.keys(allowedTables).join(", ")}`,
          400
        );
      }

      const entityId = Number(id);
      if (isNaN(entityId)) {
        throw this.createError("Invalid ID", 400);
      }

      // Verify item exists and is archived
      const checkQuery = sql.raw(`
        SELECT "${idColumn}" FROM "${entityType}"
        WHERE "${idColumn}" = ${entityId}
          AND "is_archived" = true
      `);

      const check = await db.execute(checkQuery);
      if (!check.rows || check.rows.length === 0) {
        throw this.createError("Item not found or is not in recently deleted", 404);
      }

      if (immediate) {
        // Hard-delete right now
        const deleteQuery = sql.raw(`
          DELETE FROM "${entityType}"
          WHERE "${idColumn}" = ${entityId}
            AND "is_archived" = true
        `);
        await db.execute(deleteQuery);

        this.success(res, null, `${entityType.slice(0, -1)} permanently deleted.`);
      } else {
        // Set countdown — purger will hard-delete when timer expires
        const purgeAt = new Date(Date.now() + DEFAULT_COUNTDOWN_MS);

        const updateQuery = sql.raw(`
          UPDATE "${entityType}"
          SET "purge_after_at" = '${purgeAt.toISOString()}',
              "updated_at" = now()
          WHERE "${idColumn}" = ${entityId}
            AND "is_archived" = true
        `);
        await db.execute(updateQuery);

        // Schedule a purge to fire after the countdown
        schedulePurge(DEFAULT_COUNTDOWN_MS);

        const seconds = Math.round(DEFAULT_COUNTDOWN_MS / 1000);
        this.success(
          res,
          { purgeAfterAt: purgeAt },
          `${entityType.slice(0, -1)} scheduled for permanent deletion in ${seconds} seconds. Restore to cancel.`
        );
      }
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/admin/purge/:entityType/:id/cancel - Cancel a pending permanent deletion countdown.
   * Clears purge_after_at so the item stays in recently deleted.
   */
  async cancelCountdown(req, res, next) {
    try {
      const { entityType, id } = req.params;

      const allowedTables = {
        courses: "course_id",
        sections: "section_id",
        chapters: "chapter_id",
        instructors: "instructor_id",
        images: "image_id",
        videos: "video_id",
        tests: "test_id",
        entries: "entry_id",
      };

      const idColumn = allowedTables[entityType];
      if (!idColumn) {
        throw this.createError(
          `Unsupported entity type: ${entityType}. Allowed: ${Object.keys(allowedTables).join(", ")}`,
          400
        );
      }

      const entityId = Number(id);
      if (isNaN(entityId)) {
        throw this.createError("Invalid ID", 400);
      }

      const updateQuery = sql.raw(`
        UPDATE "${entityType}"
        SET "purge_after_at" = NULL,
            "updated_at" = now()
        WHERE "${idColumn}" = ${entityId}
          AND "is_archived" = true
      `);

      const result = await db.execute(updateQuery);
      if (!result.rowCount || result.rowCount === 0) {
        throw this.createError("Item not found or is not in recently deleted", 404);
      }

      this.success(res, null, "Deletion countdown cancelled. Item remains in recently deleted.");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }
}

module.exports = new AdminController();