// backend/shared/workers/archivePurger.js
const { db } = require("../../config/database");
const { sql } = require("drizzle-orm");
const path = require("path");
const fs = require("fs").promises;

/**
 * Dynamically discover all tables that have archive columns
 */
async function getArchivableTables() {
  try {
    const result = await db.execute(sql`
      SELECT DISTINCT t1.table_name
      FROM information_schema.columns t1
      INNER JOIN information_schema.columns t2 
        ON t1.table_name = t2.table_name 
        AND t1.table_schema = t2.table_schema
      WHERE t1.table_schema = 'public'
        AND t1.column_name = 'is_archived'
        AND t2.column_name = 'purge_after_at'
        AND t1.table_name NOT LIKE 'drizzle_%'
    `);

    return result.rows.map(row => row.table_name);
  } catch (err) {
    console.error("Error discovering archivable tables:", err);
    return [];
  }
}

/**
 * Delete physical files for purged media
 */
async function deletePhysicalFiles(tableName, items) {
  if (!items || items.length === 0) return;

  const uploadsDir = path.resolve(process.cwd(), "uploads");

  for (const item of items) {
    try {
      let filePath = null;

      if (tableName === 'images' && item.image_url) {
        // Extract filename from URL like http://localhost:1111/uploads/images/filename.jpg
        const match = item.image_url.match(/\/uploads\/images\/([^\/]+)$/);
        if (match) {
          filePath = path.join(uploadsDir, 'images', match[1]);
        }
      } else if (tableName === 'videos' && item.slides_url) {
        // Extract filename from URL like http://localhost:1111/uploads/videos/filename.mp4
        const match = item.slides_url.match(/\/uploads\/videos\/([^\/]+)$/);
        if (match) {
          filePath = path.join(uploadsDir, 'videos', match[1]);
        }
      }

      if (filePath) {
        try {
          await fs.unlink(filePath);
          console.log(`[purger] Deleted file: ${filePath}`);
        } catch (err) {
          if (err.code !== 'ENOENT') {
            console.error(`[purger] Failed to delete file ${filePath}:`, err);
          }
        }
      }
    } catch (err) {
      console.error(`[purger] Error processing file deletion:`, err);
    }
  }
}

/**
 * Generic purge function for any table with archive columns
 */
async function purgeTableExpiredItems(tableName) {
  try {
    // First, get the items we're about to delete (for file cleanup)
    let itemsToDelete = [];
    if (tableName === 'images' || tableName === 'videos') {
      const selectQuery = sql.raw(`
        SELECT * FROM "${tableName}"
        WHERE "is_archived" = true
          AND "purge_after_at" IS NOT NULL
          AND "purge_after_at" <= now()
      `);
      
      const result = await db.execute(selectQuery);
      itemsToDelete = result.rows;
    }

    // Delete from database
    const deleteQuery = sql.raw(`
      DELETE FROM "${tableName}"
      WHERE "is_archived" = true
        AND "purge_after_at" IS NOT NULL
        AND "purge_after_at" <= now()
    `);
    
    const result = await db.execute(deleteQuery);
    const deletedCount = result?.rowCount ?? 0;

    // Delete physical files if this was images or videos
    if (deletedCount > 0 && itemsToDelete.length > 0) {
      await deletePhysicalFiles(tableName, itemsToDelete);
    }

    return deletedCount;
  } catch (err) {
    console.error(`Error purging ${tableName}:`, err);
    return 0;
  }
}

/**
 * Main purge function
 */
async function purgeExpiredSnapshots() {
  try {
    const tables = await getArchivableTables();
    
    if (tables.length === 0) {
      return;
    }

    const results = {};
    let totalDeleted = 0;

    for (const tableName of tables) {
      const deletedCount = await purgeTableExpiredItems(tableName);
      if (deletedCount > 0) {
        results[tableName] = deletedCount;
        totalDeleted += deletedCount;
      }
    }

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

module.exports = { 
  purgeExpiredSnapshots,
  getArchivableTables
};