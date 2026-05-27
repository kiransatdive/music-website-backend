import ffmpeg from "fluent-ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import ffmpegStatic from "ffmpeg-static";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

// ─── Set FFmpeg / FFprobe binary paths ───────────────────────────────────────
ffmpeg.setFfprobePath(ffprobeInstaller.path);
if (ffmpegStatic) ffmpeg.setFfmpegPath(ffmpegStatic as unknown as string);

// ─── Audio Metadata Extraction ───────────────────────────────────────────────

export interface AudioMetadata {
  duration: number;
  format: string;
  codec: string;
  bitrate: number;
}

/**
 * Extract audio metadata using FFmpeg
 * Returns duration in seconds
 */
export async function extractAudioMetadata(
  filePath: string,
): Promise<AudioMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err: Error | null, metadata: any) => {
      if (err) {
        reject(new Error(`Failed to extract audio metadata: ${err.message}`));
        return;
      }

      const stream = metadata.streams[0];
      if (!stream) {
        reject(new Error("No audio stream found in file"));
        return;
      }

      resolve({
        duration: Math.round(metadata.format.duration || 0),
        format: metadata.format.format_name || "unknown",
        codec: stream.codec_name || "unknown",
        bitrate:
          typeof stream.bit_rate === "string"
            ? parseInt(stream.bit_rate, 10)
            : stream.bit_rate || 0,
      });
    });
  });
}

// ─── Artwork Dimension Validation ────────────────────────────────────────────

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

/**
 * Extract image metadata and validate dimensions
 */
export async function extractImageMetadata(
  filePath: string,
  minWidth: number = 3000,
  minHeight: number = 3000,
): Promise<{ valid: boolean; metadata: ImageMetadata; error?: string }> {
  try {
    const data = await sharp(filePath).metadata();
    const stats = await fs.stat(filePath);

    const metadata: ImageMetadata = {
      width: data.width || 0,
      height: data.height || 0,
      format: data.format || "unknown",
      size: stats.size,
    };

    if (!data.width || !data.height) {
      return {
        valid: false,
        metadata,
        error: "Could not determine image dimensions",
      };
    }

    if (data.width < minWidth || data.height < minHeight) {
      return {
        valid: false,
        metadata,
        error: `Artwork must be at least ${minWidth}x${minHeight} pixels. Current: ${data.width}x${data.height}`,
      };
    }

    return { valid: true, metadata };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      valid: false,
      metadata: { width: 0, height: 0, format: "unknown", size: 0 },
      error: `Failed to validate image: ${errorMessage}`,
    };
  }
}

// ─── File Validation ─────────────────────────────────────────────────────────

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate audio file (WAV only)
 */
export function validateAudioFile(
  file: Express.Multer.File,
): FileValidationResult {
  const ALLOWED_MIME_TYPES = [
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/vnd.wave",
  ];
  const ALLOWED_EXTENSIONS = [".wav"];

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: "Only WAV audio files are accepted",
    };
  }

  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return {
      valid: false,
      error: "File extension must be .wav",
    };
  }

  return { valid: true };
}

/**
 * Validate artwork file (JPG/PNG only)
 */
export function validateArtworkFile(
  file: Express.Multer.File,
): FileValidationResult {
  const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];
  const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png"];

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: "Only JPG and PNG images are accepted",
    };
  }

  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return {
      valid: false,
      error: "File extension must be .jpg, .jpeg, or .png",
    };
  }

  return { valid: true };
}

// ─── File Cleanup ───────────────────────────────────────────────────────────

/**
 * Delete a file from the filesystem
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // Log error but don't throw - file cleanup shouldn't fail the request
    console.error(`Failed to delete file ${filePath}:`, error);
  }
}
