import { Request, Response } from "express";
import Artist from "../models/Artist.ts";
import Release from "../models/Release.ts";
import RoyaltyReport from "../models/RoyaltyReport.ts";
import sequelize from "../config/database.ts";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // 1. Total artist count
    const totalArtists = await Artist.count();

    // 2. Active (live) releases count
    const activeReleases = await Release.count({
      where: { status: "live" },
    });

    // 3. Pending approval releases count
    const pendingReleases = await Release.count({
      where: { status: "pending_review" },
    });

    // 4. Total revenue (sum of income in RoyaltyReport)
    const revenueResult = await RoyaltyReport.findAll({
      attributes: [
        [sequelize.fn("SUM", sequelize.col("income")), "totalRevenue"],
      ],
      raw: true,
    });

    let totalRevenue = 0;
    if (revenueResult && revenueResult.length > 0) {
      totalRevenue = parseFloat((revenueResult[0] as any).totalRevenue) || 0;
    }

    return res.status(200).json({
      success: true,
      data: {
        totalArtists,
        activeReleases,
        pendingReleases,
        totalRevenue,
      },
    });
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
      error: error.message,
    });
  }
};
