import { Router } from "express";
import adminPlatformController from "../controllers/adminPlatformController.ts";
import { authenticateArtist } from "../middleware/artistAuthMiddleware.ts";

const router = Router();

// Get all active platforms for artists
router.get(
  "/platforms",
  authenticateArtist,
  adminPlatformController.getAllPlatforms.bind(adminPlatformController),
);

export default router;
