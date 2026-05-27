import Release from "../models/Release.js";
import Track from "../models/Track.js";
import ReleasePlatform from "../models/ReleasePlatform.js";
import Platform from "../models/Platform.js";
import Artist from "../models/Artist.js";
import sequelize from "../config/database.js";
import type {
  CreateReleaseInput,
  UpdateReleaseInput,
} from "../utils/releaseValidation.js";
import notificationService from "./notificationService.js";
import { sendStatusChangeEmail } from "./emailService.js";

//  Custom Service Error

export class ReleaseServiceError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ReleaseServiceError";
    this.statusCode = statusCode;
  }
}

// Release Service

export class ReleaseService {
  //  Create a new release

  async createRelease(
    artistId: number,
    data: CreateReleaseInput,
  ): Promise<Release> {
    try {
      // Convert releaseDate string to Date if needed
      const releaseData = {
        ...data,
        releaseDate:
          typeof data.releaseDate === "string"
            ? new Date(data.releaseDate)
            : data.releaseDate,
        artistId,
        status: "draft" as const,
      };

      const release = await Release.create(releaseData);

      return release;
    } catch (error) {
      throw new ReleaseServiceError("Failed to create release", 500);
    }
  }

  // Get release by ID with artist details
  async getReleaseById(
    releaseId: number,
    artistId?: number,
  ): Promise<Release | null> {
    const release = await Release.findByPk(releaseId, {
      include: [
        {
          model: Artist,
          as: "artist",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    if (!release) {
      return null;
    }

    // Check authorization if artistId is provided
    if (artistId && release.artistId !== artistId) {
      throw new ReleaseServiceError("Unauthorized access to this release", 403);
    }

    return release;
  }

  // Get all releases for an artist
  async getReleasesByArtistId(
    artistId: number,
    options?: {
      status?: string;
      limit?: number;
      offset?: number;
      search?: string;
    },
  ): Promise<{ rows: Release[]; count: number }> {
    const where: any = { artistId };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.search) {
      where.title = sequelize.where(
        sequelize.fn("LOWER", sequelize.col("title")),
        "LIKE",
        `%${options.search.toLowerCase()}%`,
      );
    }

    const { rows, count } = await Release.findAndCountAll({
      where,
      limit: options?.limit ?? 10,
      offset: options?.offset ?? 0,
      include: [
        {
          model: Artist,
          as: "artist",
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return { rows, count };
  }

  // Update release details
  async updateRelease(
    releaseId: number,
    artistId: number,
    data: UpdateReleaseInput,
  ): Promise<Release> {
    const release = await this.getReleaseById(releaseId, artistId);
    if (!release) {
      throw new ReleaseServiceError("Release not found", 404);
    }

    if (release.status !== "draft") {
      throw new ReleaseServiceError(
        "Can only update releases in draft status",
        400,
      );
    }

    // Convert releaseDate string to Date if provided
    const { releaseDate, ...releaseFields } = data;

    const updateData: Partial<{
      title: string;
      genre: string;
      language: string;
      releaseDate: Date;
      releaseType: "single" | "ep" | "album";
      labelName: string;
      upc: string;
    }> = {
      ...releaseFields,
      ...(releaseDate && {
        releaseDate:
          typeof releaseDate === "string" ? new Date(releaseDate) : releaseDate,
      }),
    };

    await release.update(updateData);
    return release;
  }

  // Delete release (only in draft status)
  async deleteRelease(releaseId: number, artistId: number): Promise<void> {
    const release = await this.getReleaseById(releaseId, artistId);
    if (!release) {
      throw new ReleaseServiceError("Release not found", 404);
    }

    if (release.status !== "draft") {
      throw new ReleaseServiceError(
        "Can only delete releases in draft status",
        400,
      );
    }

    await release.destroy();
  }

  // Upload artwork
  async updateArtwork(releaseId: number, artistId: number, artworkPath: string): Promise<Release> {
    const release = await this.getReleaseById(releaseId, artistId);
    if (!release) {
      throw new ReleaseServiceError('Release not found', 404);
    }

    await release.update({ artwork: artworkPath });
    return release;
  }

  // Submit release for review
  async submitRelease(
    releaseId: number,
    artistId: number,
    youtubeCriteriaIds: number[],
  ): Promise<Release> {
    const release = await this.getReleaseById(releaseId, artistId);
    if (!release) {
      throw new ReleaseServiceError("Release not found", 404);
    }

    // Validate submission requirements
    const trackCount = await Track.count({ where: { releaseId } });
    if (trackCount === 0) {
      throw new ReleaseServiceError("At least one track must be uploaded", 400);
    }

    if (!release.artwork) {
      throw new ReleaseServiceError(
        "Artwork must be uploaded before submission",
        400,
      );
    }

    // Validate YouTube Criteria acknowledgment
    const YoutubeCriteria = require("../models/YoutubeCriteria.js").default;
    const activeCriteria = await YoutubeCriteria.findAll({
      where: { isActive: true },
    });
    const activeCriteriaIds = activeCriteria.map((c: any) => c.id);

    const hasAcknowledgedAll = activeCriteriaIds.every((id: number) =>
      youtubeCriteriaIds.includes(id),
    );
    if (!hasAcknowledgedAll) {
      throw new ReleaseServiceError(
        "You must acknowledge all active YouTube criteria before submitting",
        400,
      );
    }

    // Auto-validate external links against whitelist
    if (release.externalLinks && release.externalLinks.length > 0) {
      const { URL } = require("url");
      const WhitelistDomain = require("../models/WhitelistDomain.js").default;

      for (const link of release.externalLinks) {
        try {
          const urlObj = new URL(link);
          let domain = urlObj.hostname.replace(/^www\./, "");

          const isWhitelisted = await WhitelistDomain.findOne({
            where: {
              domain,
              status: "APPROVED",
              isActive: true,
            },
          });

          if (!isWhitelisted) {
            // Auto-reject the release
            const reason = `Link ${domain} is not whitelisted`;
            await release.update({
              status: "rejected",
              rejectionReason: reason,
            });

            // Return early since it's rejected
            return release;
          }
        } catch (e) {
          // Invalid URL format
          await release.update({
            status: "rejected",
            rejectionReason: `Invalid URL format in external links`,
          });
          return release;
        }
      }
    }

    // Update status to pending_review and save acknowledged criteria
    await release.update({
      status: "pending_review",
      youtubeCriteriaIds,
    });
    return release;
  }

  // Get release details with tracks and platforms
  async getReleaseDetails(releaseId: number, artistId?: number): Promise<any> {
    const release = await Release.findByPk(releaseId, {
      include: [
        {
          model: Artist,
          as: "artist",
          attributes: ["id", "name", "email"],
        },
        {
          model: Track,
          as: "tracks",
          attributes: ["id", "trackTitle", "duration", "audioFile", "isrc"],
        },
      ],
    });

    if (!release) {
      return null;
    }

    if (artistId && release.artistId !== artistId) {
      throw new ReleaseServiceError("Unauthorized access to this release", 403);
    }

    // Get associated platforms using the association getter
    const platforms = await (release as any).getPlatforms({
      attributes: ["id", "name"],
    });

    return {
      ...release.toJSON(),
      platforms,
    };
  }

  // Add platforms to release
  async addPlatformsToRelease(
    releaseId: number,
    platformIds: number[],
  ): Promise<void> {
    const release = await Release.findByPk(releaseId);
    if (!release) {
      throw new ReleaseServiceError("Release not found", 404);
    }

    await (release as any).setPlatforms(platformIds);
  }

  // Admin: Get all releases (with optional filters)
  async getAllReleases(options?: {
    status?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<{ rows: Release[]; count: number }> {
    const where: any = {};

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.search) {
      where.title = sequelize.where(
        sequelize.fn("LOWER", sequelize.col("title")),
        "LIKE",
        `%${options.search.toLowerCase()}%`,
      );
    }

    const { rows, count } = await Release.findAndCountAll({
      where,
      limit: options?.limit ?? 20,
      offset: options?.offset ?? 0,
      include: [
        {
          model: Artist,
          as: "artist",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return { rows, count };
  }

  // Admin: Update release status (Approve, Reject, Live, Take down)
  async updateReleaseStatus(
    releaseId: number,
    status: "approved" | "rejected" | "live" | "taken_down",
    reason?: string,
  ): Promise<Release> {
    const release = await Release.findByPk(releaseId, {
      include: [
        {
          model: Artist,
          as: "artist",
          attributes: ["id", "email"],
        },
      ],
    });

    if (!release) {
      throw new ReleaseServiceError("Release not found", 404);
    }

    // Update status and reason
    const updateData: any = { status };
    if (status === "rejected" && reason) {
      updateData.rejectionReason = reason;
    }

    await release.update(updateData);

    const artist = (release as any).artist;

    // Send in-app notification
    try {
      let title = `Release ${status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}`;
      let message = `The status of your release "${release.title}" is now ${status.replace("_", " ")}.`;

      if (status === "rejected") {
        message += ` Reason: ${reason}`;
      }

      await notificationService.createNotification(
        release.artistId,
        title,
        message,
        "release_status_update",
        false, // Do not send generic email since we send a custom one below
      );
    } catch (err) {
      console.error("Failed to create in-app notification", err);
    }

    // Send email notification
    if (artist && artist.email) {
      try {
        await sendStatusChangeEmail(
          artist.email,
          release.title,
          status,
          status === "rejected" ? reason : undefined,
        );
      } catch (err) {
        console.error("Failed to send status change email", err);
      }
    }

    return release;
  }
}

export default new ReleaseService();
