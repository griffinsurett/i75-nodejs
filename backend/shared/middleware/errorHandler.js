// ==================== middleware/errorHandler.js ====================
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // PostgreSQL specific errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique constraint violation
        return res.status(409).json({
          error: 'Resource already exists',
          message: err.detail
        });
      case '23503': // Foreign key violation
        return res.status(400).json({
          error: 'Invalid reference',
          message: 'Referenced resource does not exist'
        });
      case '23502': // Not null violation
        return res.status(400).json({
          error: 'Missing required field',
          message: err.message
        });
      default:
        return res.status(500).json({
          error: 'Database error',
          message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
  }

  // General errors
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};

module.exports = errorHandler;