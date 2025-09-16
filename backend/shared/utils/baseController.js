// backend/shared/utils/baseController.js
const { eq, count } = require("drizzle-orm");

class BaseController {
  constructor() {
    // Auto-bind all methods
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));
    methods
      .filter(method => method !== 'constructor' && typeof this[method] === 'function')
      .forEach(method => {
        this[method] = this[method].bind(this);
      });
  }

  /**
   * Wrap a transaction with error handling
   */
  async withTransaction(db, callback) {
    return await db.transaction(async (tx) => {
      return await callback(tx);
    });
  }

  /**
   * Create an error with status
   */
  createError(message, status = 400) {
    const error = new Error(message);
    error.status = status;
    return error;
  }

  /**
   * Throw a 404 not found error
   */
  throwNotFound(entityName) {
    throw this.createError(`${entityName} not found`, 404);
  }

  /**
   * Standard error response handler
   */
  handleError(error, res, next) {
    const status = error.status || 
      (error.message.includes("not found") ? 404 :
       error.message.includes("Cannot delete") || 
       error.message.includes("is required") ? 400 : 500);
    
    if (status !== 500) {
      return res.status(status).json({ 
        success: false, 
        message: error.message 
      });
    }
    next(error);
  }

  /**
   * Check if entity exists
   */
  async checkExists(tx, table, idField, id, entityName) {
    const result = await tx
      .select()
      .from(table)
      .where(eq(idField, id));
    
    if (result.length === 0) {
      this.throwNotFound(entityName);
    }
    
    return result[0];
  }

  /**
   * Get entity or throw 404
   */
  async getOrThrow(tx, table, idField, id, entityName) {
    return await this.checkExists(tx, table, idField, id, entityName);
  }

  /**
   * Check count of related entities
   */
  async checkRelatedCount(tx, table, field, value) {
    const result = await tx
      .select({ count: count() })
      .from(table)
      .where(eq(field, value));
    
    return Number(result?.[0]?.count || 0);
  }

  /**
   * Validate required field
   */
  validateRequired(value, fieldName) {
    if (!value?.trim || !value.trim()) {
      throw this.createError(`${fieldName} is required`, 400);
    }
    return value.trim();
  }

  /**
   * Standard archive operation
   */
  async archive(db, table, idField, id, entityName) {
    const existing = await db
      .select()
      .from(table)
      .where(eq(idField, id));
    
    if (existing.length === 0) {
      this.throwNotFound(entityName);
    }

    const [updated] = await db
      .update(table)
      .set({
        isArchived: true,
        archivedAt: new Date(),
        purgeAfterAt: null,
        updatedAt: new Date(),
      })
      .where(eq(idField, id))
      .returning();

    return updated;
  }

  /**
   * Standard restore operation
   */
  async restore(db, table, idField, id, entityName) {
    const existing = await db
      .select()
      .from(table)
      .where(eq(idField, id));
    
    if (existing.length === 0) {
      this.throwNotFound(entityName);
    }

    const [updated] = await db
      .update(table)
      .set({
        isArchived: false,
        archivedAt: null,
        purgeAfterAt: null,
        updatedAt: new Date(),
      })
      .where(eq(idField, id))
      .returning();

    return updated;
  }

  /**
   * Success response
   */
  success(res, data, message = null, status = 200) {
    const response = { success: true };
    if (data !== undefined) response.data = data;
    if (message) response.message = message;
    return res.status(status).json(response);
  }
}

module.exports = BaseController;