import { Router } from "express";
import adminPlatformController from "../controllers/adminPlatformController.js";
import { authenticateAdmin } from "../middleware/adminAuthMiddleware.js";

import { uploadArtwork } from "../middleware/releaseUploadMiddleware.js";

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
