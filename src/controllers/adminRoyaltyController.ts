import { Request, Response } from "express";
import * as xlsx from "xlsx";
import RoyaltyReport from "../models/RoyaltyReport.ts";
import Release from "../models/Release.ts";
import sequelize from "../config/database.ts";

export const uploadRoyaltyReport = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { originalname, buffer } = req.file;

    // Parse the Excel file from memory buffer
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert worksheet to JSON
    // Assume the first row contains headers. Adjust according to the actual excel format.
    const jsonData = xlsx.utils.sheet_to_json<any>(worksheet);

    if (!jsonData || jsonData.length === 0) {
      return res.status(400).json({ success: false, message: "Uploaded file is empty or invalid" });
    }

    const reportName = req.body.reportName || originalname;

    // Map excel columns to database fields. Adjust keys based on expected excel headers.
    // Excel Headers mapping might be required. I will provide a generic mapping or expect matching column names.
    const parseNumber = (val: any, isFloat: boolean = false): number | null => {
      if (val === null || val === undefined || val === "") return null;
      const strVal = String(val).replace(/,/g, "");
      const num = isFloat ? parseFloat(strVal) : parseInt(strVal, 10);
      return isNaN(num) ? null : num;
    };

    const mappedData = jsonData.map((row: any) => {
      // Normalize row keys (lowercase, remove spaces and non-alphanumeric chars)
      const normalizedRow: any = {};
      for (const key in row) {
        if (Object.prototype.hasOwnProperty.call(row, key)) {
          const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
          normalizedRow[normalizedKey] = row[key];
        }
      }

      return {
        reportName,
        mainLabel: normalizedRow["mainlabel"] || normalizedRow["label"] || null,
        subLabel: normalizedRow["sublabel"] || null,
        records: parseNumber(normalizedRow["records"], false),
        totalPlays: parseNumber(normalizedRow["totalplays"] || normalizedRow["plays"], false),
        income: parseNumber(normalizedRow["income"], true),
        adminExp: parseNumber(normalizedRow["adminexp"] || normalizedRow["adminexpenses"] || normalizedRow["expenses"], true),
        royalty: parseNumber(normalizedRow["royalty"], true),
        month: normalizedRow["month"] || null,
        stream: parseNumber(normalizedRow["stream"] || normalizedRow["streams"], false),
      };
    });

    // Start a transaction for bulk insert
    const transaction = await sequelize.transaction();

    try {
      // Bulk insert
      const insertedRows = await RoyaltyReport.bulkCreate(mappedData, { transaction });
      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: "Royalty report uploaded successfully",
        data: insertedRows,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error("Error uploading royalty report:", error);
    return res.status(500).json({ success: false, message: "Failed to upload royalty report", error: error.message });
  }
};

export const getAllRoyaltyReports = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await RoyaltyReport.findAndCountAll({
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error: any) {
    console.error("Error fetching royalty reports:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch royalty reports", error: error.message });
  }
};

export const getRevenueAnalytics = async (req: Request, res: Response) => {
  try {
    // Calculate total royalty
    const royaltyResult = await RoyaltyReport.findAll({
      attributes: [
        [sequelize.fn("SUM", sequelize.col("royalty")), "totalRoyalty"],
      ],
      raw: true,
    });

    let totalRoyalty = 0;
    if (royaltyResult && royaltyResult.length > 0) {
      totalRoyalty = parseFloat((royaltyResult[0] as any).totalRoyalty) || 0;
    }

    // Count live releases
    const liveReleasesCount = await Release.count({
      where: { status: "live" },
    });

    // Month-wise revenue
    const monthwiseRevenue = await RoyaltyReport.findAll({
      attributes: [
        "month",
        [sequelize.fn("SUM", sequelize.col("royalty")), "revenue"],
      ],
      group: ["month"],
      order: [["month", "ASC"]],
      raw: true,
    });

    // Month-wise live releases uploaded
    const monthwiseLiveReleases = await Release.findAll({
      attributes: [
        [sequelize.fn("DATE_FORMAT", sequelize.col("createdAt"), "%Y-%m"), "month"],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: { status: "live" },
      group: [sequelize.fn("DATE_FORMAT", sequelize.col("createdAt"), "%Y-%m")],
      order: [[sequelize.fn("DATE_FORMAT", sequelize.col("createdAt"), "%Y-%m"), "ASC"]],
      raw: true,
    });

    return res.status(200).json({
      success: true,
      data: {
        totalRoyalty,
        liveReleasesCount,
        monthwiseRevenue,
        monthwiseLiveReleases,
      },
    });
  } catch (error: any) {
    console.error("Error fetching revenue analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch revenue analytics",
      error: error.message,
    });
  }
};

export const getRoyaltyFilesSummary = async (req: Request, res: Response) => {
  try {
    const incomeResult = await RoyaltyReport.findAll({
      attributes: [
        [sequelize.fn("SUM", sequelize.col("income")), "totalIncome"],
      ],
      raw: true,
    });
    const totalIncome = parseFloat((incomeResult[0] as any).totalIncome) || 0;

    const files = await RoyaltyReport.findAll({
      attributes: [
        "reportName",
        [sequelize.fn("MAX", sequelize.col("createdAt")), "dateUploaded"],
        [sequelize.fn("SUM", sequelize.col("income")), "fileIncome"],
      ],
      group: ["reportName"],
      order: [[sequelize.fn("MAX", sequelize.col("createdAt")), "DESC"]],
      raw: true,
    });

    const totalReports = files.length;

    return res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalReports,
        files,
      },
    });
  } catch (error: any) {
    console.error("Error fetching royalty files summary:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch royalty files summary",
      error: error.message,
    });
  }
};
