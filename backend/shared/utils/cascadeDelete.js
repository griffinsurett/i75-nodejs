// backend/shared/utils/cascadeDelete.js
const { eq, count } = require("drizzle-orm");

/**
 * Helper to count usage across all tables in schema
 */
async function getMediaUsageCountFromSchema(tx, mediaId, fieldName, schema) {
  let totalUsage = 0;
  
  for (const [tableName, tableSchema] of Object.entries(schema)) {
    // Skip the media tables themselves
    if (tableName === 'images' || tableName === 'videos') continue;
    
    // Check if this table has the field we're looking for
    if (tableSchema[fieldName]) {
      const result = await tx
        .select({ count: count() })
        .from(tableSchema)
        .where(eq(tableSchema[fieldName], mediaId));
      totalUsage += Number(result[0]?.count || 0);
    }
  }
  
  return totalUsage;
}

/**
 * Handle cascade deletion of exclusive media
 * Simply checks if entity has imageId or videoId and cascades if exclusive
 */
async function cascadeDeleteMedia(tx, entity, schema, purgeAfterMs = 60000) {
  const cascadedMedia = { image: false, video: false };
  const now = Date.now();
  const purgeAt = new Date(now + purgeAfterMs);

  // Check for imageId
  if (entity.imageId) {
    const totalUsage = await getMediaUsageCountFromSchema(tx, entity.imageId, 'imageId', schema);
    
    if (totalUsage === 1) {
      await tx
        .update(schema.images)
        .set({
          isArchived: true,
          archivedAt: new Date(now),
          purgeAfterAt: purgeAt,
          updatedAt: new Date(now),
        })
        .where(eq(schema.images.imageId, entity.imageId));
      
      cascadedMedia.image = true;
    }
  }

  // Check for videoId  
  if (entity.videoId) {
    const totalUsage = await getMediaUsageCountFromSchema(tx, entity.videoId, 'videoId', schema);
    
    if (totalUsage === 1) {
      await tx
        .update(schema.videos)
        .set({
          isArchived: true,
          archivedAt: new Date(now),
          purgeAfterAt: purgeAt,
          updatedAt: new Date(now),
        })
        .where(eq(schema.videos.videoId, entity.videoId));
      
      cascadedMedia.video = true;
    }
  }

  // Also check thumbnailImageId for videos
  if (entity.thumbnailImageId) {
    const totalUsage = await getMediaUsageCountFromSchema(tx, entity.thumbnailImageId, 'thumbnailImageId', schema);
    
    if (totalUsage === 1) {
      await tx
        .update(schema.images)
        .set({
          isArchived: true,
          archivedAt: new Date(now),
          purgeAfterAt: purgeAt,
          updatedAt: new Date(now),
        })
        .where(eq(schema.images.imageId, entity.thumbnailImageId));
      
      cascadedMedia.thumbnailImage = true;
    }
  }

  return cascadedMedia;
}

/**
 * Archive an entity with a purge timer
 */
async function archiveEntity(tx, table, idField, entityId, purgeAfterMs = 60000) {
  const now = Date.now();
  const purgeAt = new Date(now + purgeAfterMs);

  await tx
    .update(table)
    .set({
      isArchived: true,
      archivedAt: new Date(now),
      purgeAfterAt: purgeAt,
      updatedAt: new Date(now),
    })
    .where(eq(idField, entityId));
}

module.exports = {
  cascadeDeleteMedia,
  archiveEntity
};