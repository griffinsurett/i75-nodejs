// ==================== shared/utils/responses.js ====================

/**
 * Standardized API response utilities
 */
const responses = {
  success: (data, message = null) => ({
    success: true,
    data,
    ...(message && { message })
  }),

  error: (message, status = 500) => ({
    success: false,
    message,
    status
  }),

  created: (data, message = null) => ({
    success: true,
    data,
    ...(message && { message })
  }),

  notFound: (entity = "Resource") => ({
    success: false,
    message: `${entity} not found`,
    status: 404
  }),

  badRequest: (message) => ({
    success: false,
    message,
    status: 400
  }),

  deleted: (message = "Resource deleted successfully") => ({
    success: true,
    message
  })
};

module.exports = responses;