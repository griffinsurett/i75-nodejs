const express = require("express");
const router = express.Router();
const adminController = require("./admin.controller");

// POST /api/admin/purge  { retention_days?: number }  — monthly bulk purge
router.post("/purge", adminController.purgeRecentlyDeleted);

// DELETE /api/admin/purge/:entityType/:id  { immediate?: boolean }  — delete from recently deleted (countdown or immediate)
router.delete("/purge/:entityType/:id", adminController.deleteFromRecentlyDeleted);

// POST /api/admin/purge/:entityType/:id/cancel  — cancel a pending countdown
router.post("/purge/:entityType/:id/cancel", adminController.cancelCountdown);

module.exports = router;