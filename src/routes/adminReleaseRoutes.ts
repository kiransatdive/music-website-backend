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
  getReleaseStats,
  adminUpdateTrackDetails,
  getReleaseDetailsAdmin,
  adminUpdateArtwork,
  adminUpdateReleaseDetails,
} from "../controllers/adminReleaseController.js";
import { authenticateAdmin } from "../middleware/adminAuthMiddleware.ts";
import { uploadAudio, uploadArtwork } from "../middleware/releaseUploadMiddleware.ts";

const router = Router();

// All these routes require admin authentication
router.use("/admin/releases", authenticateAdmin);

router.get("/admin/releases/stats", getReleaseStats);
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
router.get("/admin/releases/:id", getReleaseDetailsAdmin);
router.put("/admin/releases/:id", adminUpdateReleaseDetails);
router.put("/admin/releases/:id/artwork", uploadArtwork.single("artwork"), adminUpdateArtwork);

// Track routes
router.put("/admin/tracks/:id", authenticateAdmin, uploadAudio.single("track"), adminUpdateTrackDetails);

export default router;
