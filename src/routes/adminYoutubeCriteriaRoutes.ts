import { Router } from "express";
import adminYoutubeCriteriaController from "../controllers/adminYoutubeCriteriaController.js";
import { authenticateAdmin } from "../middleware/adminAuthMiddleware.js";

const router = Router();

// Protect all admin youtube criteria routes
router.use("/admin/youtube-criteria", authenticateAdmin);

// Get all criteria (active and inactive)
router.get(
  "/admin/youtube-criteria",
  adminYoutubeCriteriaController.getAllCriteria.bind(
    adminYoutubeCriteriaController,
  ),
);

// Create new criteria
router.post(
  "/admin/youtube-criteria",
  adminYoutubeCriteriaController.createCriteria.bind(
    adminYoutubeCriteriaController,
  ),
);

// Edit criteria (creates new version, inactivates old)
router.put(
  "/admin/youtube-criteria/:id",
  adminYoutubeCriteriaController.editCriteria.bind(
    adminYoutubeCriteriaController,
  ),
);

// Remove criteria (soft delete / inactivate)
router.delete(
  "/admin/youtube-criteria/:id",
  adminYoutubeCriteriaController.removeCriteria.bind(
    adminYoutubeCriteriaController,
  ),
);

export default router;