// backend/shared/middleware/requestLogger.js
const requestLogger = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
  }
  
  next();
};

module.exports = requestLogger;