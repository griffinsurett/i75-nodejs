// backend/shared/workers/archivePurger.js
const { db } = require("../../config/database");
const { sql } = require("drizzle-orm");

/**
 * Archive Purger — on-demand only.
 * Instead of polling on an interval, callers schedule a purge via
 * schedulePurge(delayMs) which fires a single setTimeout.
 */

// Track active timers so they can be cleared on shutdown
const activeTimers = new Set();

/**
 * Get foreign key dependencies from PostgreSQL information schema
 */
async function getForeignKeyDependencies() {
  const query = sql`
    SELECT
      tc.table_name as child_table,
      ccu.table_name AS parent_table
    FROM
      information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
  `;

  const result = await db.execute(query);
  return result.rows;
}

/**
 * Get all tables that have archive columns
 */
async function getArchivableTables() {
  const query = sql`
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name IN ('is_archived', 'purge_after_at')
    GROUP BY table_name
    HAVING COUNT(DISTINCT column_name) = 2
  `;

  const result = await db.execute(query);
  return result.rows.map(row => row.table_name);
}

/**
 * Build a dependency graph and perform topological sort
 */
function topologicalSort(tables, dependencies) {
  // Build adjacency list
  const graph = {};
  const inDegree = {};

  // Initialize
  tables.forEach(table => {
    graph[table] = [];
    inDegree[table] = 0;
  });

  // Build graph
  dependencies.forEach(dep => {
    if (tables.includes(dep.child_table) && tables.includes(dep.parent_table)) {
      graph[dep.parent_table].push(dep.child_table);
      inDegree[dep.child_table]++;
    }
  });

  // Kahn's algorithm for topological sort
  const queue = [];
  const sorted = [];

  // Find nodes with no dependencies
  Object.keys(inDegree).forEach(table => {
    if (inDegree[table] === 0) {
      queue.push(table);
    }
  });

  while (queue.length > 0) {
    const table = queue.shift();
    sorted.push(table);

    graph[table].forEach(child => {
      inDegree[child]--;
      if (inDegree[child] === 0) {
        queue.push(child);
      }
    });
  }

  // Reverse to get deletion order (children before parents)
  return sorted.reverse();
}

/**
 * Purge expired items from a specific table
 */
async function purgeTableExpiredItems(tableName) {
  try {
    // Chapters transition to indefinite archive instead of being hard-deleted
    if (tableName === 'chapters') {
      const updateQuery = sql.raw(`
        UPDATE "chapters"
        SET "purge_after_at" = NULL, "updated_at" = NOW()
        WHERE "is_archived" = true
          AND "purge_after_at" IS NOT NULL
          AND "purge_after_at" <= now()
      `);

      const result = await db.execute(updateQuery);
      const archivedCount = result.rowCount || 0;

      if (archivedCount > 0) {
        console.log(`[purger] Transitioned ${archivedCount} chapter(s) to indefinite archive`);
      }

      return archivedCount;
    }

    const deleteQuery = sql.raw(`
      DELETE FROM "${tableName}"
      WHERE "is_archived" = true
        AND "purge_after_at" IS NOT NULL
        AND "purge_after_at" <= now()
    `);

    const result = await db.execute(deleteQuery);
    const deletedCount = result.rowCount || 0;

    if (deletedCount > 0) {
      console.log(`[purger] Deleted ${deletedCount} archived item(s) from ${tableName}`);
    }

    return deletedCount;
  } catch (error) {
    console.error(`Error purging ${tableName}:`, error.message);
    return 0;
  }
}

/**
 * Main purge function - dynamically determines order and purges all expired records
 */
async function purgeExpiredSnapshots() {
  try {
    // Get tables and dependencies
    const [tables, dependencies] = await Promise.all([
      getArchivableTables(),
      getForeignKeyDependencies()
    ]);

    if (tables.length === 0) {
      return;
    }

    // Determine deletion order
    const deletionOrder = topologicalSort(tables, dependencies);

    let totalDeleted = 0;

    // Process tables in dependency order
    for (const tableName of deletionOrder) {
      const deletedCount = await purgeTableExpiredItems(tableName);
      totalDeleted += deletedCount;
    }

    if (totalDeleted > 0) {
      console.log(`[purger] Total purged across all tables: ${totalDeleted} items`);
    }
  } catch (error) {
    console.error("Fatal error in purge process:", error);
  }
}

/**
 * Schedule a purge to run after a delay (fires once via setTimeout).
 * Adds a small buffer (2s) to ensure the purge_after_at timestamp has passed.
 */
function schedulePurge(delayMs) {
  const timerDelay = delayMs + 2000; // 2s buffer past the purge_after_at timestamp
  const timer = setTimeout(async () => {
    activeTimers.delete(timer);
    await purgeExpiredSnapshots();
  }, timerDelay);

  activeTimers.add(timer);
  return timer;
}

/**
 * Clear all pending purge timers (for graceful shutdown)
 */
function clearAllTimers() {
  for (const timer of activeTimers) {
    clearTimeout(timer);
  }
  activeTimers.clear();
}

module.exports = {
  purgeExpiredSnapshots,
  schedulePurge,
  clearAllTimers,
};
