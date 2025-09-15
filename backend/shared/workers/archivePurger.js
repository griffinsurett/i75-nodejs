// ==================== shared/workers/archivePurger.js ====================
const { db } = require("../../config/database");
const { sql } = require("drizzle-orm");

/**
 * Dynamically discover all tables that have archive columns
 * by querying the PostgreSQL information schema
 */
async function getArchivableTables() {
  try {
    // Find all tables that have BOTH is_archived and purge_after_at columns
    const result = await db.execute(sql`
      SELECT DISTINCT t1.table_name
      FROM information_schema.columns t1
      INNER JOIN information_schema.columns t2 
        ON t1.table_name = t2.table_name 
        AND t1.table_schema = t2.table_schema
      WHERE t1.table_schema = 'public'
        AND t1.column_name = 'is_archived'
        AND t2.column_name = 'purge_after_at'
        AND t1.table_name NOT LIKE 'drizzle_%'  -- Exclude Drizzle migration tables
    `);

    return result.rows.map(row => row.table_name);
  } catch (err) {
    console.error("Error discovering archivable tables:", err);
    return [];
  }
}

/**
 * Generic purge function for any table with archive columns
 */
async function purgeTableExpiredItems(tableName) {
  try {
    const query = sql.raw(`
      DELETE FROM "${tableName}"
      WHERE "is_archived" = true
        AND "purge_after_at" IS NOT NULL
        AND "purge_after_at" <= now()
    `);
    
    const result = await db.execute(query);
    return result?.rowCount ?? 0;
  } catch (err) {
    console.error(`Error purging ${tableName}:`, err);
    return 0;
  }
}

/**
 * Main purge function that automatically handles ALL archivable tables
 */
async function purgeExpiredSnapshots() {
  try {
    // Dynamically discover all tables with archive columns
    const tables = await getArchivableTables();
    
    if (tables.length === 0) {
      return; // No archivable tables found
    }

    const results = {};
    let totalDeleted = 0;

    // Process each discovered table
    for (const tableName of tables) {
      const deletedCount = await purgeTableExpiredItems(tableName);
      if (deletedCount > 0) {
        results[tableName] = deletedCount;
        totalDeleted += deletedCount;
      }
    }

    // Log results if anything was deleted
    if (totalDeleted > 0) {
      const details = Object.entries(results)
        .map(([table, count]) => `${count} ${table}`)
        .join(', ');
      
      console.log(`[purger] Deleted ${totalDeleted} archived item(s): ${details}`);
    }
  } catch (err) {
    console.error("Archive purge error:", err);
  }
}

/**
 * Get statistics about pending deletions across all archivable tables
 */
async function getArchiveStats() {
  const tables = await getArchivableTables();
  const stats = {};
  
  for (const tableName of tables) {
    try {
      const query = sql.raw(`
        SELECT 
          '${tableName}' as table_name,
          COUNT(*) FILTER (WHERE "is_archived" = true AND "purge_after_at" IS NULL) as archived_count,
          COUNT(*) FILTER (WHERE "is_archived" = true AND "purge_after_at" IS NOT NULL) as pending_delete_count,
          MIN("purge_after_at") FILTER (WHERE "is_archived" = true AND "purge_after_at" IS NOT NULL) as next_purge_at
        FROM "${tableName}"
      `);
      
      const result = await db.execute(query);
      if (result.rows[0]) {
        stats[tableName] = result.rows[0];
      }
    } catch (err) {
      console.error(`Error getting stats for ${tableName}:`, err);
    }
  }
  
  return stats;
}

module.exports = { 
  purgeExpiredSnapshots,
  getArchiveStats,
  getArchivableTables  // Export for testing/debugging
};