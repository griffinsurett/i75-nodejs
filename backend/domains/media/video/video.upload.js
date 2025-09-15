// ==================== domains/media/video/video.upload.js ====================
const uploadService = require('../upload/upload.service');

/**
 * Video upload configuration
 */
const videoUploadConfig = {
  directory: 'videos',
  maxFileSize: 100 * 1024 * 1024, // 100MB
  fieldName: 'file',
  fileFilter: (req, file, cb) => {
    const allowedTypes = /video\/(mp4|mpeg|quicktime|webm|x-msvideo|x-matroska)/i;
    const isValid = allowedTypes.test(file.mimetype);
    
    if (isValid) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not supported for videos`), false);
    }
  }
};

// Create the multer middleware for video uploads
const videoUploadMiddleware = uploadService.createUploader(videoUploadConfig);

module.exports = videoUploadMiddleware;