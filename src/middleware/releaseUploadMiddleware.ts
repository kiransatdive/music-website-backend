import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { Request } from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Directory Setup

const audioDir = path.join(__dirname, "..", "..", "uploads", "audio");
const artworkDir = path.join(__dirname, "..", "..", "uploads", "covers");

// Ensure directories exist
[audioDir, artworkDir].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

//audio upload middleware
const audioStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, audioDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    callback(null, uniqueName);
  },
});

const audioFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
) => {
  const allowedMimeTypes = [
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/vnd.wave",
  ];
  const allowedExtensions = [".wav"];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(new Error("Only WAV audio files are accepted"));
  }

  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return callback(new Error("File extension must be .wav"));
  }

  callback(null, true);
};

export const uploadAudio = multer({
  storage: audioStorage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
  fileFilter: audioFileFilter,
});

//artwork upload middleware
const artworkStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, artworkDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    callback(null, uniqueName);
  },
});

const artworkFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
) => {
  const allowedMimeTypes = ["image/jpeg", "image/png"];
  const allowedExtensions = [".jpg", ".jpeg", ".png"];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(new Error("Only JPG and PNG images are accepted"));
  }

  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return callback(new Error("File must be JPG or PNG"));
  }

  callback(null, true);
};

export const uploadArtwork = multer({
  storage: artworkStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: artworkFileFilter,
});
