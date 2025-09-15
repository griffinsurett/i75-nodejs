// ==================== domains/media/upload/upload.service.js ====================
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

class UploadService {
  constructor() {
    this.UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");
  }

  /**
   * Ensure directory exists
   */
  ensureDirectory(subDir) {
    const dirPath = path.join(this.UPLOAD_ROOT, subDir);
    fs.mkdirSync(dirPath, { recursive: true });
    return dirPath;
  }

  /**
   * Generate unique filename
   */
  generateFilename(originalName) {
    const ext = path.extname(originalName || "").toLowerCase();
    const hash = crypto.randomBytes(8).toString("hex");
    return `${Date.now()}-${hash}${ext}`;
  }

  /**
   * Create multer instance with configuration
   */
  createUploader(config) {
    const {
      directory = "misc",
      fileFilter,
      maxFileSize = 10 * 1024 * 1024, // 10MB default
      fieldName = "file"
    } = config;

    // Ensure directory exists
    this.ensureDirectory(directory);

    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, path.join(this.UPLOAD_ROOT, directory));
      },
      filename: (req, file, cb) => {
        cb(null, this.generateFilename(file.originalname));
      },
    });

    const upload = multer({
      storage,
      fileFilter,
      limits: { fileSize: maxFileSize },
    });

    return upload.single(fieldName);
  }

  /**
   * Process uploaded file metadata
   */
  processFile(file, req, directory) {
    const publicUrl = `${req.protocol}://${req.get("host")}/uploads/${directory}/${file.filename}`;
    
    return {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      publicUrl,
      directory,
    };
  }

  /**
   * Delete file from filesystem
   */
  async deleteFile(filePath) {
    try {
      await fs.promises.unlink(filePath);
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }
}

module.exports = new UploadService();