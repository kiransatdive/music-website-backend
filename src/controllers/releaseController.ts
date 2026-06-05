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
  updateTrackSchema,
  addPlatformsSchema,
} from "../utils/releaseValidation.js";
import {
  validateAudioFile,
  validateArtworkFile,
  extractImageMetadata,
  deleteFile,
} from "../utils/mediaProcessing.js";
import path from "path";
import type { ArtistRequest } from "../middleware/artistAuthMiddleware.js";
import Artist from "../models/Artist.js";
import RoyaltyReport from "../models/RoyaltyReport.js";
import Release from "../models/Release.js";
import sequelize from "../config/database.js";
import { Op } from "sequelize";

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
        data: release,
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

  // Get release statistics / counts for artist
  async getReleaseStats(req: Request, res: Response): Promise<void> {
    try {
      const artistId = (req as ArtistRequest).artist?.id;
      if (!artistId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const stats = await releaseService.getReleaseCountsByArtist(artistId);

      const artist = await Artist.findByPk(artistId);
      let total_income = 0;
      let monthwiseRevenue: any[] = [];
      let monthwiseLiveReleases: any[] = [];

      if (artist) {
        const royaltyWhere = {
          [Op.or]: [
            { subLabel: artist.artistLabelName || artist.name },
            { mainLabel: artist.artistLabelName || artist.name },
          ],
        };

        const royaltyStats = await RoyaltyReport.findAll({
          attributes: [
            [sequelize.fn("SUM", sequelize.col("income")), "totalIncome"],
          ],
          where: royaltyWhere,
          raw: true,
        });

        if (royaltyStats && royaltyStats.length > 0) {
          total_income = parseFloat((royaltyStats[0] as any).totalIncome) || 0;
        }

        monthwiseRevenue = await RoyaltyReport.findAll({
          attributes: [
            [sequelize.fn("DATE_FORMAT", sequelize.col("createdAt"), "%Y-%m"), "month"],
            [sequelize.fn("SUM", sequelize.col("income")), "revenue"],
          ],
          where: royaltyWhere,
          group: [sequelize.fn("DATE_FORMAT", sequelize.col("createdAt"), "%Y-%m")],
          order: [[sequelize.fn("DATE_FORMAT", sequelize.col("createdAt"), "%Y-%m"), "ASC"]],
          raw: true,
        });

        monthwiseLiveReleases = await Release.findAll({
          attributes: [
            [sequelize.fn("DATE_FORMAT", sequelize.col("createdAt"), "%Y-%m"), "month"],
            [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          ],
          where: {
            status: "live",
            artistId: artistId
          },
          group: [sequelize.fn("DATE_FORMAT", sequelize.col("createdAt"), "%Y-%m")],
          order: [[sequelize.fn("DATE_FORMAT", sequelize.col("createdAt"), "%Y-%m"), "ASC"]],
          raw: true,
        });
      }

      res.status(200).json({
        success: true,
        data: {
          ...stats,
          total_income,
          monthwiseRevenue,
          monthwiseLiveReleases,
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

  // Get all tracks for a release
  async getTracks(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const artistId = (req as ArtistRequest).artist?.id;
      if (!artistId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Verify release belongs to artist
      const release = await releaseService.getReleaseById(
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

      const tracks = await trackService.getTracksByReleaseId(parseInt(id, 10));

      res.status(200).json({
        success: true,
        data: tracks,
      });
    } catch (error) {
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
        data: track,
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

  // Update track details
  async updateTrack(req: Request, res: Response): Promise<void> {
    try {
      const { id, trackId } = req.params;
      const artistId = (req as ArtistRequest).artist?.id;
      if (!artistId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Validate request body
      const validationResult = updateTrackSchema.safeParse(req.body);
      if (!validationResult.success) {
        if (req.file) await deleteFile(req.file.path);
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.flatten(),
        });
        return;
      }

      let audioFilePath: string | undefined;

      // If a new track file is provided
      if (req.file) {
        const fileValidation = validateAudioFile(req.file);
        if (!fileValidation.valid) {
          await deleteFile(req.file.path);
          res.status(400).json({
            success: false,
            message: fileValidation.error,
          });
          return;
        }
        audioFilePath = req.file.path;
      }

      // Verify release belongs to artist
      const release = await releaseService.getReleaseById(
        parseInt(id, 10),
        artistId,
      );
      if (!release) {
        if (req.file) await deleteFile(req.file.path);
        res.status(404).json({
          success: false,
          message: "Release not found",
        });
        return;
      }

      // Verify track belongs to this release
      const track = await trackService.getTrackById(parseInt(trackId, 10));
      if (!track || track.releaseId !== parseInt(id, 10)) {
        if (req.file) await deleteFile(req.file.path);
        res.status(404).json({
          success: false,
          message: "Track not found for this release",
        });
        return;
      }

      // Update track
      const updatedTrack = await trackService.updateTrack(
        parseInt(trackId, 10),
        validationResult.data,
        audioFilePath
      );

      res.status(200).json({
        success: true,
        message: "Track updated successfully",
        data: updatedTrack,
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

  // Delete track
  async deleteTrack(req: Request, res: Response): Promise<void> {
    try {
      const { id, trackId } = req.params;
      const artistId = (req as ArtistRequest).artist?.id;
      if (!artistId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Verify release belongs to artist
      const release = await releaseService.getReleaseById(
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

      // Verify track belongs to this release
      const track = await trackService.getTrackById(parseInt(trackId, 10));
      if (!track || track.releaseId !== parseInt(id, 10)) {
        res.status(404).json({
          success: false,
          message: "Track not found for this release",
        });
        return;
      }

      // Delete the track
      await trackService.deleteTrack(parseInt(trackId, 10));

      res.status(200).json({
        success: true,
        message: "Track deleted successfully",
      });
    } catch (error) {
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

      const updatedRelease = await releaseService.updateArtwork(parseInt(id, 10), artistId, artwork);

      res.status(201).json({
        success: true,
        message: "Artwork uploaded successfully",
        data: updatedRelease,
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
   * PUT /api/releases/:id/artwork
   * Update artwork for release
   */
  async updateArtwork(req: Request, res: Response): Promise<void> {
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

      const updatedRelease = await releaseService.updateArtwork(parseInt(id, 10), artistId, artwork);

      res.status(200).json({
        success: true,
        message: "Artwork updated successfully",
        data: updatedRelease,
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

      try {
        const Artist = (await import("../models/Artist.js")).default;
        const AdminNotification = (await import("../models/AdminNotification.js")).default;

        const artist = await Artist.findByPk(artistId);
        const artistName = artist ? artist.name : `Artist ${artistId}`;

        await AdminNotification.create({
          title: "New Release Submission",
          message: `${artistName} has submitted a new release "${release.title}" for review.`,
          type: "release_submission",
          isRead: false,
        });
      } catch (err) {
        console.error("Failed to create admin notification for release submission", err);
      }

      res.status(200).json({
        success: true,
        message: "Release submitted successfully",
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

  // Add platforms to release
  async addPlatforms(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const artistId = (req as ArtistRequest).artist?.id;
      if (!artistId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Validate request body
      const validationResult = addPlatformsSchema.safeParse(req.body);
      if (!validationResult.success) {
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
        res.status(404).json({
          success: false,
          message: "Release not found",
        });
        return;
      }

      await releaseService.addPlatformsToRelease(
        parseInt(id, 10),
        validationResult.data.platformIds,
      );

      res.status(200).json({
        success: true,
        message: "Platforms added to release successfully",
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
