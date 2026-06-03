import { Request, Response } from "express";
import * as xlsx from "xlsx";
import RoyaltyReport from "../models/RoyaltyReport.js";
import sequelize from "../config/database.js";

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
      };
    });

    // Start a transaction for bulk insert
    const transaction = await sequelize.transaction();

    try {
      // Bulk insert
      await RoyaltyReport.bulkCreate(mappedData, { transaction });
      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: "Royalty report uploaded successfully",
        data: mappedData,
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
