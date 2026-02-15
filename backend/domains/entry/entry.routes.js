// backend/domains/entry/entry.routes.js
const express = require("express");
const router = express.Router();
const entryController = require("./entry.controller");

// CRUD Routes for Entries
router.get("/", entryController.getAllEntries);
router.get("/:entryId", entryController.getEntryById);
router.post("/", entryController.createEntry);
router.put("/:entryId", entryController.updateEntry);

// Archive operations
router.post("/:entryId/archive", entryController.archiveEntry);
router.post("/:entryId/restore", entryController.restoreEntry);

// Safety delete (schedule purge in 60s)
router.delete("/:entryId", entryController.deleteEntry);

module.exports = router;
