import { Router } from "express";
import {
  approveRelease,
  rejectRelease,
  markReleaseLive,
  takeDownRelease,
  getPendingReleases,
  getAllReleases,
  deleteRelease,
  bulkDeleteReleases,
  bulkApproveReleases,
  bulkRejectReleases,
} from "../controllers/adminReleaseController.js";
import { authenticateAdmin } from "../middleware/adminAuthMiddleware.js";

const router = Router();

// All these routes require admin authentication
router.use("/admin/releases", authenticateAdmin);

router.get("/admin/releases", getAllReleases);
router.get("/admin/releases/pending", getPendingReleases);
router.post("/admin/releases/bulk-approve", bulkApproveReleases);
router.post("/admin/releases/bulk-reject", bulkRejectReleases);
router.post("/admin/releases/:id/approve", approveRelease);
router.post("/admin/releases/:id/reject", rejectRelease);
router.post("/admin/releases/:id/live", markReleaseLive);
router.post("/admin/releases/:id/take-down", takeDownRelease);
router.delete("/admin/releases/bulk-delete", bulkDeleteReleases);
router.delete("/admin/releases/:id", deleteRelease);

export default router;
