import { Request, Response } from "express";
import { YoutubeCriteria } from "../models/index.js";

class YoutubeCriteriaController {
  // Fetch active criteria for artists to acknowledge
  async getActiveCriteria(req: Request, res: Response): Promise<void> {
    try {
      const criteria = await YoutubeCriteria.findAll({
        where: { isActive: true },
        order: [["createdAt", "ASC"]], // Maintain order in which they were created
        attributes: ["id", "text"], // Only send necessary fields
      });

      res.status(200).json({
        success: true,
        data: criteria,
      });
    } catch (error) {
      console.error("Error fetching active youtube criteria:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
}

export default new YoutubeCriteriaController();
