// backend/shared/middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  };

  return rateLimit({ ...defaultOptions, ...options });
};

// Different limiters for different routes
const apiLimiter = createRateLimiter();

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5, // stricter for auth routes
  skipSuccessfulRequests: true,
});

const uploadLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10, // stricter for uploads
});

module.exports = {
  createRateLimiter,
  apiLimiter,
  authLimiter,
  uploadLimiter,
};