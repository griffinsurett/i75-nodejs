// backend/domains/media/video/video.service.js
const { videos } = require("../../../config/schema");
const { eq, count } = require("drizzle-orm");

const videoService = {
  /**
   * Create standardized error
   */
  createError(message, status = 500) {
    const error = new Error(message);
    error.status = status;
    return error;
  },

  /**
   * Handle video creation logic - used by any domain that needs videos
   */
  async handleVideoCreation(tx, { video_id, video_url, title, description, thumbnail_image_id }) {
    if (video_id) {
      await this.validateVideoExists(tx, video_id);
      return video_id;
    }
    
    if (video_url && title) {
      const [videoRow] = await tx
        .insert(videos)
        .values({ 
          title,
          description: description || null,
          slidesUrl: video_url,
          thumbnailImageId: thumbnail_image_id || null,
          isArchived: false,
          createdAt: new Date(),
        })
        .returning();
      return videoRow.videoId;
    }
    
    return null;
  },

  /**
   * Handle video update logic - used by any domain updating videos
   */
  async handleVideoUpdate(tx, currentVideoId, { video_id, video_url, title, description, thumbnail_image_id }) {
    if (video_id !== undefined) {
      if (video_id === null) {
        return null;
      } else {
        await this.validateVideoExists(tx, video_id);
        return video_id;
      }
    }
    
    if (video_url !== undefined && video_url !== null && video_url !== "" && title) {
      if (currentVideoId) {
        await tx
          .update(videos)
          .set({ 
            title,
            description: description || null,
            slidesUrl: video_url,
            thumbnailImageId: thumbnail_image_id || null,
            updatedAt: new Date(),
          })
          .where(eq(videos.videoId, currentVideoId));
        return currentVideoId;
      } else {
        const [videoRow] = await tx
          .insert(videos)
          .values({ 
            title,
            description: description || null,
            slidesUrl: video_url,
            thumbnailImageId: thumbnail_image_id || null,
            isArchived: false,
            createdAt: new Date(),
          })
          .returning();
        return videoRow.videoId;
      }
    }
    
    return currentVideoId;
  },

  /**
   * Validate that a video exists
   */
  async validateVideoExists(tx, videoId) {
    const videoCheck = await tx
      .select({ count: count() })
      .from(videos)
      .where(eq(videos.videoId, videoId));
    
    if (Number(videoCheck?.[0]?.count || 0) === 0) {
      throw this.createError("Provided video_id does not exist", 400);
    }
  },

  /**
   * Check if video is used in other tables
   */
  async checkVideoUsage(videoId, table, field, tx) {
    const [result] = await tx
      .select({ count: count() })
      .from(table)
      .where(eq(field, videoId));
    
    return Number(result.count);
  },

  /**
   * Get all videos with optional archive filter
   */
  async getAllVideos(tx, showArchived = false) {
    return await tx
      .select()
      .from(videos)
      .where(eq(videos.isArchived, showArchived))
      .orderBy(videos.title);
  },

  /**
   * Get single video by ID
   */
  async getVideoById(tx, videoId) {
    const [result] = await tx
      .select()
      .from(videos)
      .where(eq(videos.videoId, videoId));

    if (!result) {
      throw this.createError("Video not found", 404);
    }

    return result;
  },

  /**
   * Create new video
   */
  async createVideo(tx, { title, description, slidesUrl, thumbnailImageId }) {
    if (!title) {
      throw this.createError("Title is required", 400);
    }

    const [result] = await tx
      .insert(videos)
      .values({
        title,
        description: description || null,
        slidesUrl: slidesUrl || null,
        thumbnailImageId: thumbnailImageId || null,
        isArchived: false,
        createdAt: new Date(),
      })
      .returning();

    return result;
  },

  /**
   * Update existing video
   */
  async updateVideo(tx, videoId, { title, description, slidesUrl, thumbnailImageId }) {
    const updateData = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (slidesUrl !== undefined) updateData.slidesUrl = slidesUrl;
    if (thumbnailImageId !== undefined) updateData.thumbnailImageId = thumbnailImageId;

    const result = await tx
      .update(videos)
      .set(updateData)
      .where(eq(videos.videoId, videoId))
      .returning();

    if (result.length === 0) {
      throw this.createError("Video not found", 404);
    }

    return result[0];
  },

  /**
   * Delete video (permanent)
   */
  async deleteVideo(tx, videoId) {
    const result = await tx
      .delete(videos)
      .where(eq(videos.videoId, videoId))
      .returning();

    if (result.length === 0) {
      throw this.createError("Video not found", 404);
    }

    return result[0];
  },
};

module.exports = videoService;