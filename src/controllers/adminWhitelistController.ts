import { Request, Response } from "express";
import whitelistService, {
  WhitelistServiceError,
} from "../services/whitelistService.js";
import {
  toggleWhitelistStatusSchema,
  rejectWhitelistSchema,
} from "../utils/whitelistValidation.js";
import type { AdminRequest } from "../middleware/adminAuthMiddleware.js";

class AdminWhitelistController {
  async getWhitelistDomains(req: Request, res: Response): Promise<void> {
    try {
      const {
        category,
        search,
        status,
        limit = "20",
        offset = "0",
      } = req.query;

      const result = await whitelistService.getWhitelistDomains({
        category: category as string,
        search: search as string,
        status: status as string,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      });

      res.status(200).json({
        success: true,
        data: result.rows,
        pagination: {
          total: result.count,
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10),
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  async getWhitelistDomain(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const whitelist = await whitelistService.getWhitelistDomain(
        parseInt(id, 10),
      );

      res.status(200).json({
        success: true,
        data: whitelist,
      });
    } catch (error) {
      if (error instanceof WhitelistServiceError) {
        res
          .status(error.statusCode)
          .json({ success: false, message: error.message });
        return;
      }
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  async deleteWhitelistDomain(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await whitelistService.deleteWhitelistDomain(parseInt(id, 10));

      res.status(200).json({
        success: true,
        message: "Whitelist domain deleted successfully",
      });
    } catch (error) {
      if (error instanceof WhitelistServiceError) {
        res
          .status(error.statusCode)
          .json({ success: false, message: error.message });
        return;
      }
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  async toggleStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const validationResult = toggleWhitelistStatusSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.flatten(),
        });
        return;
      }

      const whitelist = await whitelistService.toggleStatus(
        parseInt(id, 10),
        validationResult.data.isActive,
      );

      res.status(200).json({
        success: true,
        message: "Whitelist domain status updated",
        data: whitelist,
      });
    } catch (error) {
      if (error instanceof WhitelistServiceError) {
        res
          .status(error.statusCode)
          .json({ success: false, message: error.message });
        return;
      }
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  async approveDomain(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = (req as AdminRequest).admin?.id;
      if (!adminId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const whitelist = await whitelistService.approveDomain(
        parseInt(id, 10),
        adminId,
      );

      res.status(200).json({
        success: true,
        message: "Whitelist domain approved",
        data: whitelist,
      });
    } catch (error) {
      if (error instanceof WhitelistServiceError) {
        res
          .status(error.statusCode)
          .json({ success: false, message: error.message });
        return;
      }
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  async rejectDomain(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = (req as AdminRequest).admin?.id;
      if (!adminId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const validationResult = rejectWhitelistSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.flatten(),
        });
        return;
      }

      const whitelist = await whitelistService.rejectDomain(
        parseInt(id, 10),
        adminId,
        validationResult.data.rejectionReason,
      );

      res.status(200).json({
        success: true,
        message: "Whitelist domain rejected",
        data: whitelist,
      });
    } catch (error) {
      if (error instanceof WhitelistServiceError) {
        res
          .status(error.statusCode)
          .json({ success: false, message: error.message });
        return;
      }
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
}

export default new AdminWhitelistController();
