// Periodically and permanently delete courses that were "safety deleted"
// (archived + purge_after_at in the past).
const { db } = require("../../config/database");
const { courses } = require("../../config/schema");
const { sql } = require("drizzle-orm");

/**
 * Delete archived courses whose purge_after_at has passed.
 * If a user restores a course, purge_after_at is set to NULL, so it won't match.
 */
async function purgeExpiredSnapshots() {
  try {
    // Use raw SQL for clarity and correctness across drivers
    const result = await db.execute(sql`
      DELETE FROM "courses"
      WHERE "is_archived" = true
        AND "purge_after_at" IS NOT NULL
        AND "purge_after_at" <= now()
    `);

    // Some drivers return rowCount, others return nothing—this is just a best-effort log
    const deleted = result?.rowCount ?? 0;
    if (deleted > 0) {
      console.log(`[purger] Deleted ${deleted} archived course(s)`);
    }
  } catch (err) {
    console.error("Archive purge error:", err);
  }
}

module.exports = { purgeExpiredSnapshots };
