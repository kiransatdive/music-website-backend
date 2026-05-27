import { Request, Response } from "express";
import whitelistService, {
  WhitelistServiceError,
} from "../services/whitelistService.js";
import { createWhitelistSchema } from "../utils/whitelistValidation.js";
import type { ArtistRequest } from "../middleware/artistAuthMiddleware.js";

class ArtistWhitelistController {
  async submitWhitelistDomain(req: Request, res: Response): Promise<void> {
    try {
      const artistId = (req as ArtistRequest).artist?.id;
      if (!artistId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const validationResult = createWhitelistSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.flatten(),
        });
        return;
      }

      const whitelist = await whitelistService.createWhitelistDomain(
        validationResult.data,
        artistId,
      );

      res.status(201).json({
        success: true,
        message: "Whitelist domain submitted for approval",
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
        .json({
          success: false,
          message: "Internal server error",
          error: error instanceof Error ? error.message : String(error),
        });
    }
  }

  async getMyWhitelistDomains(req: Request, res: Response): Promise<void> {
    try {
      const artistId = (req as ArtistRequest).artist?.id;
      if (!artistId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      const { limit = "20", offset = "0" } = req.query;

      const result = await whitelistService.getWhitelistDomains({
        artistId,
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
}

export default new ArtistWhitelistController();
