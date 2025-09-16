// backend/shared/utils/mediaManager.js
const { eq, count } = require("drizzle-orm");
const { cascadeDeleteMedia, archiveEntity } = require("./cascadeDelete");

/**
 * Comprehensive media management utility for all domains
 * Handles creation and updating of images and videos
 * Uses cascadeDelete.js for deletion logic
 */
class MediaManager {
  /**
   * Handle image creation or linking
   */
  async handleImage(tx, { image_id, image_url, alt_text }, schema) {
    if (image_id) {
      // Validate existing image
      const imgCheck = await tx
        .select({ count: count() })
        .from(schema.images)
        .where(eq(schema.images.imageId, image_id));
      
      if (Number(imgCheck?.[0]?.count || 0) === 0) {
        throw this.createError("Provided image_id does not exist", 400);
      }
      return image_id;
    } 
    
    if (image_url) {
      // Create new image
      const [imgRow] = await tx
        .insert(schema.images)
        .values({ 
          imageUrl: image_url, 
          altText: alt_text || null,
          isArchived: false,
          createdAt: new Date()
        })
        .returning({ imageId: schema.images.imageId });
      return imgRow.imageId;
    }
    
    return null;
  }

  /**
   * Handle image update
   */
  async updateImage(tx, currentImageId, { image_id, image_url, alt_text }, schema) {
    if (image_id !== undefined) {
      if (image_id === null) {
        return null;
      } else {
        // Validate new image exists
        const imgCheck = await tx
          .select({ count: count() })
          .from(schema.images)
          .where(eq(schema.images.imageId, image_id));
        
        if (Number(imgCheck?.[0]?.count || 0) === 0) {
          throw this.createError("Provided image_id does not exist", 400);
        }
        return image_id;
      }
    } 
    
    if (image_url !== undefined && image_url !== null && image_url !== "") {
      if (currentImageId) {
        // Update existing image
        await tx
          .update(schema.images)
          .set({ 
            imageUrl: image_url, 
            altText: alt_text || null,
            updatedAt: new Date()
          })
          .where(eq(schema.images.imageId, currentImageId));
        return currentImageId;
      } else {
        // Create new image
        const [imgRow] = await tx
          .insert(schema.images)
          .values({ 
            imageUrl: image_url, 
            altText: alt_text || null,
            isArchived: false,
            createdAt: new Date()
          })
          .returning({ imageId: schema.images.imageId });
        return imgRow.imageId;
      }
    }
    
    return currentImageId;
  }

  /**
   * Handle video creation or linking
   */
  async handleVideo(tx, { video_id, video_url, title, description }, schema) {
    if (video_id) {
      // Validate existing video
      const videoCheck = await tx
        .select({ count: count() })
        .from(schema.videos)
        .where(eq(schema.videos.videoId, video_id));
      
      if (Number(videoCheck?.[0]?.count || 0) === 0) {
        throw this.createError("Provided video_id does not exist", 400);
      }
      return video_id;
    }
    
    if (video_url && title) {
      // Create new video
      const [videoRow] = await tx
        .insert(schema.videos)
        .values({ 
          title,
          description: description || null,
          slidesUrl: video_url,
          thumbnailImageId: null,
          isArchived: false,
          createdAt: new Date(),
        })
        .returning({ videoId: schema.videos.videoId });
      return videoRow.videoId;
    }
    
    return null;
  }

  /**
   * Handle video update
   */
  async updateVideo(tx, currentVideoId, { video_id, video_url, title, description }, schema) {
    if (video_id !== undefined) {
      if (video_id === null) {
        return null;
      } else {
        // Validate new video exists
        const videoCheck = await tx
          .select({ count: count() })
          .from(schema.videos)
          .where(eq(schema.videos.videoId, video_id));
        
        if (Number(videoCheck?.[0]?.count || 0) === 0) {
          throw this.createError("Provided video_id does not exist", 400);
        }
        return video_id;
      }
    }
    
    if (video_url !== undefined && video_url !== null && video_url !== "" && title) {
      if (currentVideoId) {
        // Update existing video
        await tx
          .update(schema.videos)
          .set({ 
            title,
            description: description || null,
            slidesUrl: video_url,
            thumbnailImageId: null,
            updatedAt: new Date(),
          })
          .where(eq(schema.videos.videoId, currentVideoId));
        return currentVideoId;
      } else {
        // Create new video
        const [videoRow] = await tx
          .insert(schema.videos)
          .values({ 
            title,
            description: description || null,
            slidesUrl: video_url,
            thumbnailImageId: null,
            isArchived: false,
            createdAt: new Date(),
          })
          .returning({ videoId: schema.videos.videoId });
        return videoRow.videoId;
      }
    }
    
    return currentVideoId;
  }

  /**
   * Delete entity with automatic cascade for exclusive media
   * Uses the existing cascadeDelete utility
   */
  async deleteWithCascade(tx, entity, entityTable, entityIdField, entityId, schema, purgeAfterMs = 60000) {
    // Use the existing cascade delete utility
    const cascadedMedia = await cascadeDeleteMedia(tx, entity, schema, purgeAfterMs);
    
    // Use the existing archive entity utility
    await archiveEntity(tx, entityTable, entityIdField, entityId, purgeAfterMs);
    
    return cascadedMedia;
  }

  /**
   * Create standardized error
   */
  createError(message, status = 500) {
    const error = new Error(message);
    error.status = status;
    return error;
  }
}

module.exports = new MediaManager();