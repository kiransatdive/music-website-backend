import { Request, Response } from "express";
import releaseService, {
  ReleaseServiceError,
} from "../services/releaseService.js";
import trackService, { TrackServiceError } from "../services/trackService.js";
import {
  createReleaseSchema,
  updateReleaseSchema,
  submitReleaseSchema,
  uploadTrackSchema,
} from "../utils/releaseValidation.js";
import {
  validateAudioFile,
  validateArtworkFile,
  extractImageMetadata,
  deleteFile,
} from "../utils/mediaProcessing.js";
import path from "path";
import type { ArtistRequest } from "../middleware/artistAuthMiddleware.js";

export class ReleaseController {
  // Create a new release
  async createRelease(req: Request, res: Response): Promise<void> {
    try {
      const artistId = (req as ArtistRequest).artist?.id;
      if (!artistId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Validate request body
      const validationResult = createReleaseSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.flatten(),
        });
        return;
      }

      const release = await releaseService.createRelease(
        artistId,
        validationResult.data,
      );

      res.status(201).json({
        success: true,
        message: "Release created successfully",
        data: {
          id: release.id,
          status: release.status,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  // Get release details
  async getReleaseDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const artistId = (req as ArtistRequest).artist?.id;

      const release = await releaseService.getReleaseDetails(
        parseInt(id, 10),
        artistId,
      );

      if (!release) {
        res.status(404).json({
          success: false,
          message: "Release not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: release,
      });
    } catch (error) {
      if (error instanceof ReleaseServiceError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      const message =
        error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  // Get all releases for artist with pagination and filtering
  async getReleases(req: Request, res: Response): Promise<void> {
    try {
      const artistId = (req as ArtistRequest).artist?.id;
      if (!artistId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { status, limit = "10", offset = "0", search } = req.query;

      const { rows, count } = await releaseService.getReleasesByArtistId(
        artistId,
        {
          status: status as string | undefined,
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10),
          search: search as string | undefined,
        },
      );

      res.status(200).json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10),
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  // Update release details
  async updateRelease(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const artistId = (req as ArtistRequest).artist?.id;
      if (!artistId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Validate request body
      const validationResult = updateReleaseSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.flatten(),
        });
        return;
      }

      const release = await releaseService.updateRelease(
        parseInt(id, 10),
        artistId,
        validationResult.data,
      );

      res.status(200).json({
        success: true,
        message: "Release updated successfully",
        data: release,
      });
    } catch (error) {
      if (error instanceof ReleaseServiceError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      const message =
        error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  // Delete release
  async deleteRelease(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const artistId = (req as ArtistRequest).artist?.id;
      if (!artistId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      await releaseService.deleteRelease(parseInt(id, 10), artistId);

      res.status(200).json({
        success: true,
        message: "Release deleted successfully",
      });
    } catch (error) {
      if (error instanceof ReleaseServiceError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      const message =
        error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  // Upload a track to release
  async uploadTrack(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const artistId = (req as ArtistRequest).artist?.id;
      if (!artistId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No audio file provided",
        });
        return;
      }

      // Validate file
      const fileValidation = validateAudioFile(req.file);
      if (!fileValidation.valid) {
        await deleteFile(req.file.path);
        res.status(400).json({
          success: false,
          message: fileValidation.error,
        });
        return;
      }

      // Validate request body
      const validationResult = uploadTrackSchema.safeParse(req.body);
      if (!validationResult.success) {
        await deleteFile(req.file.path);
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.flatten(),
        });
        return;
      }

      // Verify release belongs to artist
      const release = await releaseService.getReleaseById(
        parseInt(id, 10),
        artistId,
      );
      if (!release) {
        await deleteFile(req.file.path);
        res.status(404).json({
          success: false,
          message: "Release not found",
        });
        return;
      }
      // Upload track
      const track = await trackService.uploadTrack(
        parseInt(id, 10),
        req.file.path,
        validationResult.data
      );

      res.status(201).json({
        success: true,
        message: "Track uploaded successfully",
        data: {
          trackId: track.id,
          releaseId: track.releaseId,
          trackTitle: track.trackTitle,
          audioFile: track.audioFile,
          duration: track.duration,
          isrc: track.isrc ?? null,
          lyrics: track.lyrics ?? null,
          featuredArtists: track.featuredArtists ?? null,
          createdAt: track.createdAt,
          updatedAt: track.updatedAt,
        },
      });
    } catch (error) {
      if (req.file) {
        await deleteFile(req.file.path);
      }

      if (
        error instanceof ReleaseServiceError ||
        error instanceof TrackServiceError
      ) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      const message =
        error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * POST /api/releases/:id/artwork
   * Upload artwork for release
   */
  async uploadArtwork(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const artistId = (req as ArtistRequest).artist?.id;
      if (!artistId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No artwork file provided",
        });
        return;
      }

      // Validate file
      const fileValidation = validateArtworkFile(req.file);
      if (!fileValidation.valid) {
        await deleteFile(req.file.path);
        res.status(400).json({
          success: false,
          message: fileValidation.error,
        });
        return;
      }

      // Validate image dimensions
      const imageValidation = await extractImageMetadata(
        req.file.path,
        3000,
        3000,
      );
      if (!imageValidation.valid) {
        await deleteFile(req.file.path);
        res.status(400).json({
          success: false,
          message: imageValidation.error,
        });
        return;
      }

      // Verify release belongs to artist
      const release = await releaseService.getReleaseById(
        parseInt(id, 10),
        artistId,
      );
      if (!release) {
        await deleteFile(req.file.path);
        res.status(404).json({
          success: false,
          message: "Release not found",
        });
        return;
      }

      // Save artwork path
      const artwork = path.relative(
        path.join(process.cwd(), "uploads"),
        req.file.path,
      );

      await releaseService.updateArtwork(parseInt(id, 10), artistId, artwork);

      res.status(201).json({
        success: true,
        message: "Artwork uploaded successfully",
        data: {
          artworkUrl: artwork,
        },
      });
    } catch (error) {
      if (req.file) {
        await deleteFile(req.file.path);
      }

      if (error instanceof ReleaseServiceError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      const message =
        error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }

  /**
   * POST /api/releases/:id/submit
   * Submit release for review
   */
  async submitRelease(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const artistId = (req as ArtistRequest).artist?.id;
      if (!artistId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Validate request body
      const validationResult = submitReleaseSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.flatten(),
        });
        return;
      }

      const release = await releaseService.submitRelease(
        parseInt(id, 10),
        artistId,
        validationResult.data.youtubeCriteriaIds,
      );

      res.status(200).json({
        success: true,
        message: "Release submitted successfully",
        data: {
          status: release.status,
        },
      });
    } catch (error) {
      if (error instanceof ReleaseServiceError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }

      const message =
        error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
}

export default new ReleaseController();
