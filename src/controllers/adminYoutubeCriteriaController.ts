import { Request, Response } from "express";
import { YoutubeCriteria } from "../models/index.js";
import { z } from "zod";

const criteriaSchema = z.object({
  text: z.string().min(1, "Criteria text is required"),
});

class AdminYoutubeCriteriaController {
  // Get all criteria (including inactive ones, for version history visibility if needed)
  async getAllCriteria(req: Request, res: Response): Promise<void> {
    try {
      const criteria = await YoutubeCriteria.findAll({
        order: [
          ["isActive", "DESC"], // Active ones first
          ["createdAt", "DESC"],
        ],
      });

      res.status(200).json({
        success: true,
        data: criteria,
      });
    } catch (error) {
      console.error("Error fetching youtube criteria:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  // Add new criteria
  async createCriteria(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = criteriaSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.flatten(),
        });
        return;
      }

      const newCriteria = await YoutubeCriteria.create({
        text: validationResult.data.text,
        isActive: true,
      });

      res.status(201).json({
        success: true,
        message: "Criteria created successfully",
        data: newCriteria,
      });
    } catch (error) {
      console.error("Error creating youtube criteria:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  // Edit criteria (marks old as inactive, creates new one to maintain history)
  async editCriteria(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validationResult = criteriaSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.flatten(),
        });
        return;
      }

      const oldCriteria = await YoutubeCriteria.findByPk(id);
      if (!oldCriteria) {
        res.status(404).json({ success: false, message: "Criteria not found" });
        return;
      }

      if (!oldCriteria.isActive) {
        res
          .status(400)
          .json({
            success: false,
            message: "Cannot edit an inactive/historical criteria item",
          });
        return;
      }

      // Mark old as inactive
      oldCriteria.isActive = false;
      await oldCriteria.save();

      // Create new version
      const newCriteria = await YoutubeCriteria.create({
        text: validationResult.data.text,
        isActive: true,
      });

      res.status(200).json({
        success: true,
        message: "Criteria updated successfully",
        data: newCriteria,
      });
    } catch (error) {
      console.error("Error updating youtube criteria:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  // Remove criteria permanently
  async removeCriteria(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const criteria = await YoutubeCriteria.findByPk(id);

      if (!criteria) {
        res.status(404).json({ success: false, message: "Criteria not found" });
        return;
      }

      await criteria.destroy();

      res.status(200).json({
        success: true,
        message: "Criteria deleted permanently",
      });
    } catch (error) {
      console.error("Error removing youtube criteria:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
}

export default new AdminYoutubeCriteriaController();
