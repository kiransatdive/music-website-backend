import { Request, Response } from "express";
import releaseService, {
  ReleaseServiceError,
} from "../services/releaseService.js";
import trackService, {
  TrackServiceError,
} from "../services/trackService.js";
import Release from "../models/Release.ts";
import Artist from "../models/Artist.ts";
import RoyaltyReport from "../models/RoyaltyReport.ts";
import sequelize from "../config/database.ts";
import { Op } from "sequelize";

export const getPendingReleases = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const search = req.query.search as string;

    const { rows, count } = await releaseService.getAllReleases({
      status: "pending_review",
      limit,
      offset,
      search,
    });

    res.status(200).json({
      success: true,
      data: rows,
      meta: {
        total: count,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Get Pending Releases Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch pending releases" });
  }
};

export const getAllReleases = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const offset = parseInt(req.query.offset as string, 10) || 0;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const { rows, count } = await releaseService.getAllReleases({
      status,
      limit,
      offset,
      search,
    });

    res.status(200).json({
      success: true,
      data: rows,
      meta: {
        total: count,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Get All Releases Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch releases" });
  }
};

export const approveRelease = async (req: Request, res: Response) => {
  try {
    const releaseId = parseInt(req.params.id, 10);
    if (isNaN(releaseId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid release ID" });
    }

    const release = await releaseService.updateReleaseStatus(
      releaseId,
      "approved",
    );
    res
      .status(200)
      .json({ success: true, message: "Release approved", release });
  } catch (error) {
    if (error instanceof ReleaseServiceError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    console.error("Approve Release Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to approve release" });
  }
};

export const rejectRelease = async (req: Request, res: Response) => {
  try {
    const releaseId = parseInt(req.params.id, 10);
    if (isNaN(releaseId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid release ID" });
    }

    const { reason } = req.body;
    if (!reason) {
      return res
        .status(400)
        .json({ success: false, message: "Rejection reason is required" });
    }

    const release = await releaseService.updateReleaseStatus(
      releaseId,
      "rejected",
      reason,
    );
    res
      .status(200)
      .json({ success: true, message: "Release rejected", release });
  } catch (error) {
    if (error instanceof ReleaseServiceError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    console.error("Reject Release Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to reject release" });
  }
};

export const markReleaseLive = async (req: Request, res: Response) => {
  try {
    const releaseId = parseInt(req.params.id, 10);
    if (isNaN(releaseId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid release ID" });
    }

    const release = await releaseService.updateReleaseStatus(releaseId, "live");
    res
      .status(200)
      .json({ success: true, message: "Release marked as live", release });
  } catch (error) {
    if (error instanceof ReleaseServiceError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    console.error("Mark Live Release Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to mark release live" });
  }
};

export const takeDownRelease = async (req: Request, res: Response) => {
  try {
    const releaseId = parseInt(req.params.id, 10);
    if (isNaN(releaseId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid release ID" });
    }

    const { reason } = req.body;

    const release = await releaseService.updateReleaseStatus(
      releaseId,
      "taken_down",
      reason,
    );
    res
      .status(200)
      .json({ success: true, message: "Release taken down", release });
  } catch (error) {
    if (error instanceof ReleaseServiceError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    console.error("Take Down Release Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to take down release" });
  }
};

export const deleteRelease = async (req: Request, res: Response) => {
  try {
    const releaseId = parseInt(req.params.id, 10);
    if (isNaN(releaseId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid release ID" });
    }

    await releaseService.adminDeleteRelease(releaseId);
    res
      .status(200)
      .json({ success: true, message: "Release deleted successfully" });
  } catch (error) {
    if (error instanceof ReleaseServiceError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    console.error("Delete Release Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete release" });
  }
};

export const bulkDeleteReleases = async (req: Request, res: Response) => {
  try {
    const { releaseIds } = req.body;

    if (!Array.isArray(releaseIds) || releaseIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "An array of releaseIds is required" });
    }

    const validIds = releaseIds
      .map((id) => parseInt(id as string, 10))
      .filter((id) => !isNaN(id));

    if (validIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid release IDs provided" });
    }

    const deletedCount = await releaseService.adminBulkDeleteReleases(validIds);

    res.status(200).json({
      success: true,
      message: `${deletedCount} release(s) deleted successfully`,
    });
  } catch (error) {
    if (error instanceof ReleaseServiceError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    console.error("Bulk Delete Releases Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to bulk delete releases" });
  }
};

export const bulkApproveReleases = async (req: Request, res: Response) => {
  try {
    const { releaseIds } = req.body;

    if (!Array.isArray(releaseIds) || releaseIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "An array of releaseIds is required" });
    }

    const validIds = releaseIds
      .map((id) => parseInt(id as string, 10))
      .filter((id) => !isNaN(id));

    if (validIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid release IDs provided" });
    }

    const updatedCount = await releaseService.adminBulkUpdateReleaseStatus(validIds, "approved");

    res.status(200).json({
      success: true,
      message: `${updatedCount} release(s) approved successfully`,
    });
  } catch (error) {
    if (error instanceof ReleaseServiceError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    console.error("Bulk Approve Releases Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to bulk approve releases" });
  }
};

export const bulkRejectReleases = async (req: Request, res: Response) => {
  try {
    const { releaseIds, reason } = req.body;

    if (!Array.isArray(releaseIds) || releaseIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "An array of releaseIds is required" });
    }

    if (!reason) {
      return res
        .status(400)
        .json({ success: false, message: "Rejection reason is required" });
    }

    const validIds = releaseIds
      .map((id) => parseInt(id as string, 10))
      .filter((id) => !isNaN(id));

    if (validIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid release IDs provided" });
    }

    const updatedCount = await releaseService.adminBulkUpdateReleaseStatus(validIds, "rejected", reason);

    res.status(200).json({
      success: true,
      message: `${updatedCount} release(s) rejected successfully`,
    });
  } catch (error) {
    if (error instanceof ReleaseServiceError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    console.error("Bulk Reject Releases Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to bulk reject releases" });
  }
};


export const getReleaseStats = async (req: Request, res: Response) => {
  try {
    const total_releases = await Release.count();
    const pending_review = await Release.count({ where: { status: "pending_review" } });
    const approved_release = await Release.count({ where: { status: "approved" } });
    const live_releases = await Release.count({ where: { status: "live" } });
    const rejects_release = await Release.count({ where: { status: "rejected" } });

    const total_artists = await Artist.count();

    const artists = await Artist.findAll({ attributes: ["artistLabelName", "name"] });
    const validNames = artists.map((a: any) => a.artistLabelName || a.name).filter(Boolean);

    let total_income = 0;
    let total_streams = 0;

    if (validNames.length > 0) {
      const royaltyStats = await RoyaltyReport.findAll({
        attributes: [
          [sequelize.fn("SUM", sequelize.col("income")), "totalIncome"],
          [sequelize.fn("SUM", sequelize.col("stream")), "totalStreams"],
        ],
        where: {
          [Op.or]: [
            { subLabel: { [Op.in]: validNames } },
            { mainLabel: { [Op.in]: validNames } },
          ],
        },
        raw: true,
      });

      if (royaltyStats && royaltyStats.length > 0) {
        total_income = parseFloat((royaltyStats[0] as any).totalIncome) || 0;
        total_streams = parseInt((royaltyStats[0] as any).totalStreams, 10) || 0;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        total_releases,
        pending_review,
        approved_release,
        live_releases,
        rejects_release,
        total_artists,
        total_income,
        total_streams,
      },
    });
  } catch (error) {
    console.error("Get Release Stats Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch release stats" });
  }
};

export const adminUpdateTrackDetails = async (req: Request, res: Response) => {
  try {
    const trackId = parseInt(req.params.id, 10);
    if (isNaN(trackId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid track ID" });
    }

    const { trackTitle, isrc, lyrics, featuredArtists } = req.body;

    // Allow updating these specific fields
    const updateData = {
      ...(trackTitle !== undefined && { trackTitle }),
      ...(isrc !== undefined && { isrc }),
      ...(lyrics !== undefined && { lyrics }),
      ...(featuredArtists !== undefined && { featuredArtists })
    };

    const audioFilePath = req.file?.path;

    const track = await trackService.updateTrack(trackId, updateData, audioFilePath);

    res.status(200).json({
      success: true,
      message: "Track details updated successfully",
      track,
    });
  } catch (error) {
    if (error instanceof TrackServiceError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    console.error("Admin Update Track Details Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update track details" });
  }
};
export const adminUpdateReleaseDetails = async (req: Request, res: Response) => {
  try {
    const releaseId = parseInt(req.params.id, 10);
    if (isNaN(releaseId)) {
      return res.status(400).json({ success: false, message: "Invalid release ID" });
    }

    const { title, genre, language, release_type, label_name, upc, isrc } = req.body;

    const release = await Release.findByPk(releaseId);
    if (!release) {
      return res.status(404).json({ success: false, message: "Release not found" });
    }

    await release.update({
      ...(title !== undefined && { title }),
      ...(genre !== undefined && { genre }),
      ...(language !== undefined && { language }),
      ...(release_type !== undefined && { releaseType: release_type }),
      ...(label_name !== undefined && { labelName: label_name }),
      ...(upc !== undefined && { upc }),
      ...(isrc !== undefined && { isrc }),
    });

    res.status(200).json({ success: true, message: "Release updated successfully", release });
  } catch (error) {
    console.error("Admin Update Release Details Error:", error);
    res.status(500).json({ success: false, message: "Failed to update release details" });
  }
};

export const getReleaseDetailsAdmin = async (req: Request, res: Response) => {
  try {
    const releaseId = parseInt(req.params.id, 10);
    if (isNaN(releaseId)) {
      return res.status(400).json({ success: false, message: "Invalid release ID" });
    }

    // Call getReleaseDetails without passing an artistId so it works for admins
    const release = await releaseService.getReleaseDetails(releaseId);

    if (!release) {
      return res.status(404).json({ success: false, message: "Release not found" });
    }

    res.status(200).json({ success: true, data: release });
  } catch (error) {
    console.error("Get Release Details Admin Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch release details" });
  }
};

export const adminUpdateArtwork = async (req: Request, res: Response) => {
  try {
    const releaseId = parseInt(req.params.id, 10);
    if (isNaN(releaseId)) {
      return res.status(400).json({ success: false, message: "Invalid release ID" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Artwork file is required" });
    }

    const release = await Release.findByPk(releaseId);
    if (!release) {
      return res.status(404).json({ success: false, message: "Release not found" });
    }

    await release.update({ artwork: req.file.path });

    // Fetch full updated release details
    const updatedRelease = await releaseService.getReleaseDetails(releaseId);

    res.status(200).json({
      success: true,
      message: "Artwork updated successfully",
      data: updatedRelease || release,
    });
  } catch (error) {
    console.error("Admin Update Artwork Error:", error);
    res.status(500).json({ success: false, message: "Failed to update artwork" });
  }
};

