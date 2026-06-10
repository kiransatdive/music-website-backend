import { Router } from "express";
import adminPlatformController from "../controllers/adminPlatformController.ts";
import { authenticateAdmin } from "../middleware/adminAuthMiddleware.ts";

import { uploadArtwork } from "../middleware/releaseUploadMiddleware.ts";

const router = Router();

router.post(
  "/admin/platforms",
  authenticateAdmin,
  uploadArtwork.single("image"),
  adminPlatformController.createPlatform.bind(adminPlatformController),
);

router.get(
  "/admin/platforms",
  authenticateAdmin,
  adminPlatformController.getAllPlatforms.bind(adminPlatformController),
);

export default router;
