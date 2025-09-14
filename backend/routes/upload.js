// ==================== routes/uploads.js ====================
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { db } = require("../config/database");
const { images } = require("../config/schema");

// Ensure upload dirs exist
const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");
const IMAGES_DIR = path.join(UPLOAD_ROOT, "images");
fs.mkdirSync(IMAGES_DIR, { recursive: true });

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("📁 Multer destination called");
    cb(null, IMAGES_DIR);
  },
  filename: (req, file, cb) => {
    console.log("📝 Multer filename called for:", file.originalname);
    const ext = path.extname(file.originalname || "").toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    console.log("📝 Generated filename:", name);
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  console.log("🔍 File filter checking:", file.mimetype);
  const ok = /image\/(png|jpe?g|webp|gif|svg\+xml)/i.test(file.mimetype);
  console.log("🔍 File filter result:", ok ? "✅ ACCEPTED" : "❌ REJECTED");
  cb(ok ? null : new Error("Unsupported file type"), ok);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// POST /api/uploads/images
router.post("/images", (req, res, next) => {
  console.log("\n=== UPLOAD DEBUG START ===");
  console.log("🌐 Request received at:", new Date().toISOString());
  console.log("📊 Content-Type:", req.headers['content-type']);
  console.log("📊 Content-Length:", req.headers['content-length']);
  console.log("📊 Method:", req.method);
  console.log("📊 URL:", req.url);
  console.log("📊 Headers:", JSON.stringify(req.headers, null, 2));
  
  // Check if request body has been consumed
  if (req.body !== undefined) {
    console.log("⚠️  Request body already exists (may have been consumed by middleware):");
    console.log("📊 Body type:", typeof req.body);
    console.log("📊 Body keys:", Object.keys(req.body || {}));
    console.log("📊 Body content:", req.body);
  }
  
  // Check if request is readable
  console.log("📊 Request readable:", req.readable);
  console.log("📊 Request readableEnded:", req.readableEnded);
  
  next();
}, upload.single("file"), async (req, res, next) => {
  try {
    console.log("\n=== MULTER RESULT ===");
    console.log("📁 req.file:", req.file ? "✅ FILE RECEIVED" : "❌ NO FILE");
    
    if (req.file) {
      console.log("📁 File details:");
      console.log("  - Original name:", req.file.originalname);
      console.log("  - Filename:", req.file.filename);
      console.log("  - Size:", req.file.size, "bytes");
      console.log("  - Mimetype:", req.file.mimetype);
      console.log("  - Path:", req.file.path);
    }
    
    console.log("📊 req.body after multer:", req.body);
    console.log("=== UPLOAD DEBUG END ===\n");

    if (!req.file) {
      console.log("❌ ERROR: No file received by multer");
      return res.status(400).json({ 
        success: false, 
        message: "No file uploaded",
        debug: {
          contentType: req.headers['content-type'],
          hasBody: req.body !== undefined,
          bodyKeys: Object.keys(req.body || {}),
          readable: req.readable,
          readableEnded: req.readableEnded
        }
      });
    }

    const alt_text = req.body?.alt_text || null;
    const publicUrl = `${req.protocol}://${req.get("host")}/uploads/images/${req.file.filename}`;

console.log("💾 Inserting into database:");
     console.log("  - URL:", publicUrl);
     console.log("  - Alt text:", alt_text);

    const [row] = await db
      .insert(images)
       .values({ imageUrl: publicUrl, altText: alt_text })
      .returning({
        image_id: images.imageId,
        image_url: images.imageUrl,
        alt_text: images.altText,
      });

    console.log("✅ Database insert successful:", row);

    res.status(201).json({ success: true, data: row });
  } catch (err) {
    console.log("❌ Upload error:", err);
    next(err);
  }
});

module.exports = router;