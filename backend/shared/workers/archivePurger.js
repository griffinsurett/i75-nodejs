// backend/shared/workers/archivePurger.js
const { db } = require("../../config/database");
const { sql } = require("drizzle-orm");

/**
 * Archive Purger Worker
 * Dynamically determines deletion order based on foreign key dependencies
 */

const PURGE_INTERVAL = 10000; // 10 seconds

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
 * Main purge function - dynamically determines order and purges
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
 * Start the archive purger
 */
function startArchivePurger() {
  console.log("[purger] Archive purger started");
  
  // Run immediately on startup
  purgeExpiredSnapshots();
  
  // Then run periodically
  setInterval(purgeExpiredSnapshots, PURGE_INTERVAL);
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("[purger] Shutting down archive purger...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("[purger] Shutting down archive purger...");
  process.exit(0);
});

// Export both functions
module.exports = { 
  startArchivePurger,
  purgeExpiredSnapshots 
};