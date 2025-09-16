// backend/shared/middleware/index.js
const securityMiddleware = require('./security');
const bodyParserMiddleware = require('./bodyParser');
const { apiLimiter } = require('./rateLimiter');
const requestLogger = require('./requestLogger');
const setupStaticFiles = require('./staticFiles');
const errorHandler = require('./errorHandler');

const setupMiddleware = (app) => {
  // Static files first
  setupStaticFiles(app);
  
  // Pre-route middleware
  app.use(requestLogger);
  app.use(securityMiddleware());
  app.use(apiLimiter);
  app.use(bodyParserMiddleware());
};

const setupErrorHandler = (app) => {
  // Error handler must be added after routes
  app.use(errorHandler);
};

module.exports = {
  setupMiddleware,
  setupErrorHandler
};