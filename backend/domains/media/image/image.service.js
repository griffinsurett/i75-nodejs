// ==================== domains/media/image/image.service.js ====================
const { db } = require("../../../config/database");
const { images } = require("../../../config/schema");
const { eq, count } = require("drizzle-orm");

/**
 * Standard field mappings for images - use everywhere to avoid duplication
 */
const IMAGE_FIELDS = {
  image_id: images.imageId,
  image_url: images.imageUrl,
  alt_text: images.altText,
};

const imageService = {
  // Export field mappings for reuse
  IMAGE_FIELDS,

  /**
   * Create an image from uploaded file data
   */
  async createFromUpload(fileData, altText = null) {
    const [row] = await db
      .insert(images)
      .values({ 
        imageUrl: fileData.publicUrl, 
        altText: altText 
      })
      .returning(IMAGE_FIELDS);
    
    return row;
  },

  /**
   * Handle image creation logic - used by any domain that needs images
   * Can be called with either image_id (existing) or image_url (create new)
   */
  async handleImageCreation(tx, { image_id, image_url, alt_text }) {
    if (image_id) {
      // Validate existing image
      await this.validateImageExists(tx, image_id);
      return image_id;
    } 
    
    if (image_url) {
      // Create new image
      const [imgRow] = await tx
        .insert(images)
        .values({ imageUrl: image_url, altText: alt_text || null })
        .returning({ imageId: images.imageId });
      return imgRow.imageId;
    }
    
    return null;
  },

  /**
   * Handle image update logic - used by any domain updating images
   */
  async handleImageUpdate(tx, currentImageId, { image_id, image_url, alt_text }) {
    if (image_id !== undefined) {
      if (image_id === null) {
        return null;
      } else {
        // Validate new image exists
        await this.validateImageExists(tx, image_id);
        return image_id;
      }
    } 
    
    if (image_url !== undefined && image_url !== null && image_url !== "") {
      if (currentImageId) {
        // Update existing image
        await tx
          .update(images)
          .set({ imageUrl: image_url, altText: alt_text || null })
          .where(eq(images.imageId, currentImageId));
        return currentImageId;
      } else {
        // Create new image
        const [imgRow] = await tx
          .insert(images)
          .values({ imageUrl: image_url, altText: alt_text || null })
          .returning({ imageId: images.imageId });
        return imgRow.imageId;
      }
    }
    
    return currentImageId;
  },

  /**
   * Validate that an image exists
   */
  async validateImageExists(tx, imageId) {
    const imgCheck = await tx
      .select({ count: count() })
      .from(images)
      .where(eq(images.imageId, imageId));
    
    if (Number(imgCheck?.[0]?.count || 0) === 0) {
      throw this.createError("Provided image_id does not exist", 400);
    }
  },

  /**
   * Check if an image is used by a specific table/field
   * Usage: await imageService.checkImageUsage(imageId, courses, courses.imageId)
   */
  async checkImageUsage(imageId, table, field, tx = db) {
    const [result] = await tx
      .select({ count: count() })
      .from(table)
      .where(eq(field, imageId));
    
    return Number(result.count);
  },

  /**
   * Generic helper to check if image can be deleted from a domain's perspective
   * Usage: await imageService.canDeleteFromDomain(imageId, [
   *   { table: courses, field: courses.imageId },
   *   { table: sections, field: sections.imageId }
   * ])
   */
  async canDeleteFromDomain(imageId, tableFieldPairs, tx = db) {
    let totalUsage = 0;
    
    for (const { table, field } of tableFieldPairs) {
      const usage = await this.checkImageUsage(imageId, table, field, tx);
      totalUsage += usage;
    }
    
    return totalUsage === 0;
  },

  /**
   * Create standardized error
   */
  createError(message, status = 500) {
    const error = new Error(message);
    error.status = status;
    return error;
  },

  /**
   * Basic CRUD operations for internal use
   */
  async createImage(tx, { image_url, alt_text }) {
    if (!image_url) {
      throw this.createError("Image URL is required", 400);
    }

    const [result] = await tx
      .insert(images)
      .values({
        imageUrl: image_url,
        altText: alt_text,
      })
      .returning(IMAGE_FIELDS);

    return result;
  },

  async updateImage(tx, imageId, { image_url, alt_text }) {
    const [result] = await tx
      .update(images)
      .set({
        imageUrl: image_url,
        altText: alt_text,
      })
      .where(eq(images.imageId, imageId))
      .returning(IMAGE_FIELDS);

    if (result.length === 0) {
      throw this.createError("Image not found", 404);
    }

    return result;
  },

  async deleteImage(tx, imageId) {
    const [result] = await tx
      .delete(images)
      .where(eq(images.imageId, imageId))
      .returning(IMAGE_FIELDS);

    if (result.length === 0) {
      throw this.createError("Image not found", 404);
    }

    return result;
  },

  async getImageById(tx, imageId) {
    const [result] = await tx
      .select(IMAGE_FIELDS)
      .from(images)
      .where(eq(images.imageId, imageId));

    if (!result) {
      throw this.createError("Image not found", 404);
    }

    return result;
  },

  async getAllImages(tx) {
    return await tx
      .select(IMAGE_FIELDS)
      .from(images)
      .orderBy(images.imageUrl);
  },
};

module.exports = imageService;