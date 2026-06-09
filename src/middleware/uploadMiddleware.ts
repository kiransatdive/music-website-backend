import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { Request } from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const profileImageDir = path.join(
  __dirname,
  "..",
  "..",
  "uploads",
  "profile-images",
);

const imageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    fs.mkdirSync(profileImageDir, { recursive: true });
    callback(null, profileImageDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}${extension}`;

    callback(null, uniqueName);
  },
});

export const uploadProfileImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    callback: multer.FileFilterCallback,
  ) => {
    if (!imageMimeTypes.has(file.mimetype)) {
      return callback(new Error("Only JPG, PNG and WEBP images are allowed"));
    }

    return callback(null, true);
  },
});

const siteMediaDir = path.join(
  __dirname,
  "..",
  "..",
  "uploads",
  "site-media",
);

const siteMediaMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const siteMediaStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    fs.mkdirSync(siteMediaDir, { recursive: true });
    callback(null, siteMediaDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}${extension}`;

    callback(null, uniqueName);
  },
});

export const uploadSiteMedia = multer({
  storage: siteMediaStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for video/image
  },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    callback: multer.FileFilterCallback,
  ) => {
    if (!siteMediaMimeTypes.has(file.mimetype)) {
      return callback(new Error("Only JPG, PNG, WEBP images and MP4, WEBM, MOV videos are allowed"));
    }

    return callback(null, true);
  },
});
