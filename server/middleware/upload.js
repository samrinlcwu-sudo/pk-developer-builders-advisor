const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const multer = require("multer");
const env = require("../config/env");

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

function makeUploader(subfolder) {
  const dir = path.join(env.uploadsDir, subfolder);
  fs.mkdirSync(dir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
      cb(null, name);
    },
  });

  return multer({
    storage,
    limits: { fileSize: MAX_SIZE_BYTES },
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_MIME.has(file.mimetype)) {
        return cb(new Error("Only JPEG, PNG, or WEBP images are allowed."));
      }
      cb(null, true);
    },
  });
}

function publicPathFor(subfolder, filename) {
  return `/media/${subfolder}/${filename}`;
}

module.exports = { makeUploader, publicPathFor };
