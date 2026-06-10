import Track from "../models/Track.ts";
import Release from "../models/Release.ts";
import { extractAudioMetadata } from "../utils/mediaProcessing.ts";
import { uploadFileToS3, deleteFileFromS3 } from "../utils/s3Uploader.ts";
import path from "path";
import type { UploadTrackInput } from "../utils/releaseValidation.ts";

//  Custom Service Error

export class TrackServiceError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "TrackServiceError";
    this.statusCode = statusCode;
  }
}

// Track Service

export class TrackService {
  //  Upload and create a track
  async uploadTrack(
    releaseId: number,
    audioFilePath: string,
    data: UploadTrackInput,
  ): Promise<Track> {
    try {
      // Verify release exists
      const release = await Release.findByPk(releaseId);
      if (!release) {
        throw new TrackServiceError("Release not found", 404);
      }

      // Extract audio metadata
      const metadata = await extractAudioMetadata(audioFilePath);

      // Upload track to S3
      const destinationKey = `audio/${Date.now()}-${path.basename(audioFilePath)}`;
      const s3Url = await uploadFileToS3(audioFilePath, destinationKey, "audio/wav");

      // Create track
      const track = await Track.create({
        releaseId,
        trackTitle: data.trackTitle,
        audioFile: s3Url,
        duration: metadata.duration,
        isrc: data.isrc,
        lyrics: data.lyrics,
        featuredArtists: data.featuredArtists,
      });

      // Update release status if in draft
      if (release.status === "draft") {
        await release.update({ status: "uploaded" });
      }

      return track;
    } catch (error) {
      if (error instanceof TrackServiceError) {
        throw error;
      }
      throw new TrackServiceError(
        error instanceof Error ? error.message : "Failed to upload track",
        500,
      );
    }
  }

  // Get track by ID
  async getTrackById(trackId: number): Promise<Track | null> {
    return Track.findByPk(trackId, {
      include: [
        {
          model: Release,
          as: "release",
          attributes: ["id", "title", "artistId"],
        },
      ],
    });
  }

  // Get all tracks for a release
  async getTracksByReleaseId(releaseId: number): Promise<Track[]> {
    return Track.findAll({
      where: { releaseId },
      order: [["createdAt", "ASC"]],
    });
  }

  // Update track details
  async updateTrack(
    trackId: number,
    data: Partial<UploadTrackInput>,
    audioFilePath?: string
  ): Promise<Track> {
    const track = await this.getTrackById(trackId);
    if (!track) {
      throw new TrackServiceError("Track not found", 404);
    }

    const updateData: any = { ...data };

    if (audioFilePath) {
      const metadata = await extractAudioMetadata(audioFilePath);
      
      const destinationKey = `audio/${Date.now()}-${path.basename(audioFilePath)}`;
      const s3Url = await uploadFileToS3(audioFilePath, destinationKey, "audio/wav");

      if (track.audioFile) {
        await deleteFileFromS3(track.audioFile);
      }

      updateData.audioFile = s3Url;
      updateData.duration = metadata.duration;
    }

    await track.update(updateData);
    return track;
  }

  // Delete track
  async deleteTrack(trackId: number): Promise<void> {
    const track = await Track.findByPk(trackId);
    if (!track) {
      throw new TrackServiceError("Track not found", 404);
    }

    if (track.audioFile) {
      await deleteFileFromS3(track.audioFile);
    }

    await track.destroy();
  }

  // Get track count for release
  async getTrackCount(releaseId: number): Promise<number> {
    return Track.count({ where: { releaseId } });
  }
}

export default new TrackService();
