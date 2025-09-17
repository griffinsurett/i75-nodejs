// backend/domains/media/image/image.service.js
const { images } = require("../../../config/schema");
const { eq, count } = require("drizzle-orm");

const imageService = {
  /**
   * Create an image from uploaded file data
   */
  async createFromUpload(tx, fileData, altText = null) {
    const [row] = await tx
      .insert(images)
      .values({ 
        imageUrl: fileData.publicUrl, 
        altText: altText 
      })
      .returning();
    
    return row;
  },

  /**
   * Handle image creation logic - used by any domain that needs images
   */
  async handleImageCreation(tx, { image_id, image_url, alt_text }) {
    if (image_id) {
      await this.validateImageExists(tx, image_id);
      return image_id;
    } 
    
    if (image_url) {
      const [imgRow] = await tx
        .insert(images)
        .values({ imageUrl: image_url, altText: alt_text || null })
        .returning();
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
        await this.validateImageExists(tx, image_id);
        return image_id;
      }
    } 
    
    if (image_url !== undefined && image_url !== null && image_url !== "") {
      if (currentImageId) {
        await tx
          .update(images)
          .set({ 
            imageUrl: image_url, 
            altText: alt_text || null,
            updatedAt: new Date()
          })
          .where(eq(images.imageId, currentImageId));
        return currentImageId;
      } else {
        const [imgRow] = await tx
          .insert(images)
          .values({ imageUrl: image_url, altText: alt_text || null })
          .returning();
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
   */
  async checkImageUsage(imageId, table, field, tx) {
    const [result] = await tx
      .select({ count: count() })
      .from(table)
      .where(eq(field, imageId));
    
    return Number(result.count);
  },

  /**
   * Generic helper to check if image can be deleted from a domain's perspective
   */
  async canDeleteFromDomain(imageId, tableFieldPairs, tx) {
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
  async createImage(tx, { imageUrl, altText }) {
    if (!imageUrl) {
      throw this.createError("Image URL is required", 400);
    }

    const [result] = await tx
      .insert(images)
      .values({
        imageUrl: imageUrl,
        altText: altText,
        isArchived: false,
        createdAt: new Date(),
      })
      .returning();

    return result;
  },

  async updateImage(tx, imageId, { imageUrl, altText }) {
    const updateData = {
      updatedAt: new Date()
    };

    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (altText !== undefined) updateData.altText = altText;

    const result = await tx
      .update(images)
      .set(updateData)
      .where(eq(images.imageId, imageId))
      .returning();

    if (result.length === 0) {
      throw this.createError("Image not found", 404);
    }

    return result[0];
  },

  async deleteImage(tx, imageId) {
    const result = await tx
      .delete(images)
      .where(eq(images.imageId, imageId))
      .returning();

    if (result.length === 0) {
      throw this.createError("Image not found", 404);
    }

    return result[0];
  },

  async getImageById(tx, imageId) {
    const [result] = await tx
      .select()
      .from(images)
      .where(eq(images.imageId, imageId));

    if (!result) {
      throw this.createError("Image not found", 404);
    }

    return result;
  },

  async getAllImages(tx, showArchived = false) {
    return await tx
      .select()
      .from(images)
      .where(eq(images.isArchived, showArchived))
      .orderBy(images.imageUrl);
  },
};

module.exports = imageService;