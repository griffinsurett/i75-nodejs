const express = require("express");
const router = express.Router();
const archiveController = require("./archive.controller");

// GET /api/archive
router.get("/", archiveController.list);

// GET /api/archive/:archiveId
router.get("/:archiveId", archiveController.get);

// POST /api/archive/:entityType/:id  { action: 'archive'|'delete', ttl_minutes?: number }
router.post("/:entityType/:id", archiveController.moveToArchive);

// POST /api/archive/:archiveId/restore
router.post("/:archiveId/restore", archiveController.restore);

// POST /api/archive/:archiveId/cancel
router.post("/:archiveId/cancel", archiveController.cancelTimer);

// DELETE /api/archive/:archiveId  (purge snapshot now)
router.delete("/:archiveId", archiveController.purgeNow);

module.exports = router;
