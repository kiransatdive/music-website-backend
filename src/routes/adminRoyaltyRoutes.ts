import express from "express";
import multer from "multer";
import {
  uploadRoyaltyReport,
  getAllRoyaltyReports,
  getRevenueAnalytics,
  getRoyaltyFilesSummary,
} from "../controllers/adminRoyaltyController.js";
import { authenticateAdmin } from "../middleware/adminAuthMiddleware.ts";

const router = express.Router();

// Setup multer for memory storage to parse excel buffer directly
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

// Admin routes
router.post(
  "/admin/royalty-report/upload",
  authenticateAdmin,
  upload.single("file"),
  uploadRoyaltyReport
);

router.get("/admin/royalty-report/analytics", authenticateAdmin, getRevenueAnalytics);

router.get("/admin/report/summary", authenticateAdmin, getRoyaltyFilesSummary);

router.get("/admin/royalty-report", authenticateAdmin, getAllRoyaltyReports);

export default router;
