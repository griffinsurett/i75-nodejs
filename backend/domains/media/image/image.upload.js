// ==================== domains/media/image/image.upload.js ====================
const uploadService = require('../upload/upload.service');

/**
 * Image upload configuration
 */
const imageUploadConfig = {
  directory: 'images',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  fieldName: 'file',
  fileFilter: (req, file, cb) => {
    const allowedTypes = /image\/(png|jpe?g|webp|gif|svg\+xml)/i;
    const isValid = allowedTypes.test(file.mimetype);
    
    if (isValid) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not supported for images`), false);
    }
  }
};

// Create the multer middleware for image uploads
const imageUploadMiddleware = uploadService.createUploader(imageUploadConfig);

module.exports = imageUploadMiddleware;