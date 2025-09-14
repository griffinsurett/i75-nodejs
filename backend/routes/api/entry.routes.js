// ==================== routes/entries.js ====================
const express = require("express");
const router = express.Router();
const entryController = require("../../controllers/api/entry.controller");

// CRUD Routes for Entries
// GET /api/entries
router.get("/", entryController.getAllEntries);

// GET /api/entries/:entryId
router.get("/:entryId", entryController.getEntryById);

// POST /api/entries
router.post("/", entryController.createEntry);

// PUT /api/entries/:entryId
router.put("/:entryId", entryController.updateEntry);

// DELETE /api/entries/:entryId
router.delete("/:entryId", entryController.deleteEntry);

module.exports = router;
