// backend/shared/middleware/staticFiles.js
const express = require("express");
const path = require("path");
const fs = require("fs");

const setupStaticFiles = (app) => {
  const uploadRoot = path.resolve(process.cwd(), "uploads");
  
  // Ensure upload directories exist
  const directories = ['images', 'videos', 'documents'];
  directories.forEach(dir => {
    fs.mkdirSync(path.join(uploadRoot, dir), { recursive: true });
  });

  // Serve static files
  app.use("/uploads", express.static(uploadRoot, {
    maxAge: process.env.STATIC_CACHE_TIME || '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      // Set appropriate headers based on file type
      if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.png') || filePath.endsWith('.gif')) {
        res.set('Content-Type', 'image/*');
      } else if (filePath.endsWith('.mp4') || filePath.endsWith('.webm')) {
        res.set('Content-Type', 'video/*');
      }
    }
  }));
};

module.exports = setupStaticFiles;