import { Request, Response } from "express";
import platformService, { PlatformServiceError } from "../services/platformService.js";
import { createPlatformSchema } from "../utils/platformValidation.js";
import path from "path";
import { deleteFile, validateArtworkFile } from "../utils/mediaProcessing.js";

export class AdminPlatformController {
  async createPlatform(req: Request, res: Response): Promise<void> {
    try {
      if (req.file) {
        const fileValidation = validateArtworkFile(req.file);
        if (!fileValidation.valid) {
          await deleteFile(req.file.path);
          res.status(400).json({
            success: false,
            message: fileValidation.error,
          });
          return;
        }
      }

      const validationResult = createPlatformSchema.safeParse(req.body);
      if (!validationResult.success) {
        if (req.file) await deleteFile(req.file.path);
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationResult.error.flatten(),
        });
        return;
      }

      let logoPath: string | undefined;
      if (req.file) {
        logoPath = path.relative(path.join(process.cwd(), "uploads"), req.file.path).replace(/\\/g, "/");
      }

      const platform = await platformService.createPlatform({
        ...validationResult.data,
        logo: logoPath,
      });
      res.status(201).json({
        success: true,
        message: "Platform created successfully",
        data: platform,
      });
    } catch (error) {
      if (req.file) {
        await deleteFile(req.file.path);
      }
      if (error instanceof PlatformServiceError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  async getAllPlatforms(_req: Request, res: Response): Promise<void> {
    try {
      const platforms = await platformService.getAllPlatforms();
      res.status(200).json({
        success: true,
        data: platforms,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
}

export default new AdminPlatformController();
