const { db } = require("../../config/database");
const { eq, and, lte } = require("drizzle-orm");
const { archiveSnapshots } = require("../../config/schema");
const {
  insertSnapshot,
  builders,
  restorers,
} = require("../../shared/utils/archiver");

const DEFAULT_DELETE_MINUTES = Number(process.env.DELETE_TTL_MINUTES || 1);

const archiveController = {
  // List with optional filters
  list: async (req, res, next) => {
    try {
      const { status, entity_type } = req.query;
      const where = [];
      if (status && status !== "all")
        where.push(eq(archiveSnapshots.status, status));
      if (entity_type) where.push(eq(archiveSnapshots.entityType, entity_type));

      const data = await db
        .select()
        .from(archiveSnapshots)
        .where(where.length ? and(...where) : undefined)
        .orderBy(archiveSnapshots.archivedAt);

      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  },

  get: async (req, res, next) => {
    try {
      const { archiveId } = req.params;
      const [row] = await db
        .select()
        .from(archiveSnapshots)
        .where(eq(archiveSnapshots.archiveId, archiveId));
      if (!row)
        return res
          .status(404)
          .json({ success: false, message: "Archive item not found" });
      res.json({ success: true, data: row });
    } catch (e) {
      next(e);
    }
  },

  // Generic archive action (archive or delete with timer)
  moveToArchive: async (req, res, next) => {
    const { entityType, id } = req.params;
    const { action = "archive", ttl_minutes } = req.body || {};
    const ttl =
      action === "delete" ? ttl_minutes ?? DEFAULT_DELETE_MINUTES : null;

    if (!builders[entityType]) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Unsupported entity type: ${entityType}`,
        });
    }

    try {
      const result = await db.transaction(async (tx) => {
        // Build payload
        const payload = await builders[entityType](tx, Number(id));
        if (!payload) {
          const err = new Error(`${entityType} not found`);
          err.status = 404;
          throw err;
        }

        // Insert archive snapshot
        const snapshot = await insertSnapshot(tx, {
          entityType,
          entityId: Number(id),
          action,
          ttlMinutes: ttl,
          payload,
        });

        // Perform actual removal from live tables: delegate to entity-specific delete that the caller will do
        // Here we only respond; DELETE handlers will call this controller before they run their deletes.
        return snapshot;
      });

      res
        .status(201)
        .json({
          success: true,
          data: result,
          message:
            action === "delete"
              ? `Item moved to archive. Will purge after ${
                  ttl || DEFAULT_DELETE_MINUTES
                } minute(s) unless restored.`
              : "Item archived (no auto-delete).",
        });
    } catch (e) {
      const status = e.status || 500;
      if (status !== 500)
        return res.status(status).json({ success: false, message: e.message });
      next(e);
    }
  },

  // Restore from archive
  restore: async (req, res, next) => {
    try {
      const { archiveId } = req.params;
      const [row] = await db
        .select()
        .from(archiveSnapshots)
        .where(eq(archiveSnapshots.archiveId, archiveId));
      if (!row)
        return res
          .status(404)
          .json({ success: false, message: "Archive item not found" });
      if (!restorers[row.entityType])
        return res
          .status(400)
          .json({
            success: false,
            message: `Unsupported entity type: ${row.entityType}`,
          });

      await db.transaction(async (tx) => {
        // Recreate data
        await restorers[row.entityType](tx, row.payload);

        // Mark snapshot restored and remove deleteAfter
        await tx
          .update(archiveSnapshots)
          .set({
            status: "restored",
            restoredAt: new Date(),
            deleteAfter: null,
          })
          .where(eq(archiveSnapshots.archiveId, archiveId));

        // Optional: delete snapshot entirely so archive shows only active items
        await tx
          .delete(archiveSnapshots)
          .where(eq(archiveSnapshots.archiveId, archiveId));
      });

      res.json({ success: true, message: "Item restored successfully" });
    } catch (e) {
      next(e);
    }
  },

  // Cancel pending delete (turn it into plain archive)
  cancelTimer: async (req, res, next) => {
    try {
      const { archiveId } = req.params;
      const [row] = await db
        .select()
        .from(archiveSnapshots)
        .where(eq(archiveSnapshots.archiveId, archiveId));
      if (!row)
        return res
          .status(404)
          .json({ success: false, message: "Archive item not found" });

      await db
        .update(archiveSnapshots)
        .set({ status: "archived", deleteAfter: null })
        .where(eq(archiveSnapshots.archiveId, archiveId));

      res.json({
        success: true,
        message: "Deletion timer cancelled; item retained in archive.",
      });
    } catch (e) {
      next(e);
    }
  },

  // Purge a snapshot immediately
  purgeNow: async (req, res, next) => {
    try {
      const { archiveId } = req.params;
      const del = await db
        .delete(archiveSnapshots)
        .where(eq(archiveSnapshots.archiveId, archiveId))
        .returning();
      if (del.length === 0)
        return res
          .status(404)
          .json({ success: false, message: "Archive item not found" });
      res.json({ success: true, message: "Archive item purged" });
    } catch (e) {
      next(e);
    }
  },
};

module.exports = archiveController;
