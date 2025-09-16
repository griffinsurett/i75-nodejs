// backend/domains/archive/archive.controller.js
const { db } = require("../../config/database");
const { eq, and } = require("drizzle-orm");
const { archiveSnapshots } = require("../../config/schema");
const {
  insertSnapshot,
  builders,
  restorers,
} = require("../../shared/utils/archiver");
const BaseController = require("../../shared/utils/baseController");

const DEFAULT_DELETE_MINUTES = Number(process.env.DELETE_TTL_MINUTES || 1);

class ArchiveController extends BaseController {
  /**
   * GET /api/archive - List with optional filters
   */
  async list(req, res, next) {
    try {
      const { status, entity_type } = req.query;
      const where = [];
      
      if (status && status !== "all") {
        where.push(eq(archiveSnapshots.status, status));
      }
      if (entity_type) {
        where.push(eq(archiveSnapshots.entityType, entity_type));
      }

      const data = await db
        .select()
        .from(archiveSnapshots)
        .where(where.length ? and(...where) : undefined)
        .orderBy(archiveSnapshots.archivedAt);

      this.success(res, data);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * GET /api/archive/:archiveId - Get single archive item
   */
  async get(req, res, next) {
    try {
      const { archiveId } = req.params;
      const row = await this.getOrThrow(
        db, 
        archiveSnapshots, 
        archiveSnapshots.archiveId, 
        archiveId, 
        "Archive item"
      );
      
      this.success(res, row);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/archive/:entityType/:id - Generic archive action
   */
  async moveToArchive(req, res, next) {
    try {
      const { entityType, id } = req.params;
      const { action = "archive", ttl_minutes } = req.body || {};
      const ttl = action === "delete" ? ttl_minutes ?? DEFAULT_DELETE_MINUTES : null;

      if (!builders[entityType]) {
        throw this.createError(`Unsupported entity type: ${entityType}`, 400);
      }

      const result = await this.withTransaction(db, async (tx) => {
        // Build payload
        const payload = await builders[entityType](tx, Number(id));
        if (!payload) {
          this.throwNotFound(entityType);
        }

        // Insert archive snapshot
        const snapshot = await insertSnapshot(tx, {
          entityType,
          entityId: Number(id),
          action,
          ttlMinutes: ttl,
          payload,
        });

        return snapshot;
      });

      const message = action === "delete"
        ? `Item moved to archive. Will purge after ${ttl || DEFAULT_DELETE_MINUTES} minute(s) unless restored.`
        : "Item archived (no auto-delete).";

      this.success(res, result, message, 201);
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/archive/:archiveId/restore - Restore from archive
   */
  async restore(req, res, next) {
    try {
      const { archiveId } = req.params;
      
      await this.withTransaction(db, async (tx) => {
        const row = await this.getOrThrow(
          tx,
          archiveSnapshots,
          archiveSnapshots.archiveId,
          archiveId,
          "Archive item"
        );

        if (!restorers[row.entityType]) {
          throw this.createError(`Unsupported entity type: ${row.entityType}`, 400);
        }

        // Recreate data
        await restorers[row.entityType](tx, row.payload);

        // Mark snapshot restored
        await tx
          .update(archiveSnapshots)
          .set({
            status: "restored",
            restoredAt: new Date(),
            deleteAfter: null,
          })
          .where(eq(archiveSnapshots.archiveId, archiveId));

        // Delete snapshot to keep archive clean
        await tx
          .delete(archiveSnapshots)
          .where(eq(archiveSnapshots.archiveId, archiveId));
      });

      this.success(res, null, "Item restored successfully");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * POST /api/archive/:archiveId/cancel - Cancel pending delete
   */
  async cancelTimer(req, res, next) {
    try {
      const { archiveId } = req.params;
      
      const row = await this.getOrThrow(
        db,
        archiveSnapshots,
        archiveSnapshots.archiveId,
        archiveId,
        "Archive item"
      );

      await db
        .update(archiveSnapshots)
        .set({ status: "archived", deleteAfter: null })
        .where(eq(archiveSnapshots.archiveId, archiveId));

      this.success(res, null, "Deletion timer cancelled; item retained in archive.");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }

  /**
   * DELETE /api/archive/:archiveId - Purge immediately
   */
  async purgeNow(req, res, next) {
    try {
      const { archiveId } = req.params;
      
      const deleted = await db
        .delete(archiveSnapshots)
        .where(eq(archiveSnapshots.archiveId, archiveId))
        .returning();

      if (deleted.length === 0) {
        this.throwNotFound("Archive item");
      }

      this.success(res, null, "Archive item purged");
    } catch (error) {
      this.handleError(error, res, next);
    }
  }
}

module.exports = new ArchiveController();