import express from "express";
import { getDashboardStats } from "../controllers/adminDashboardController.ts";
import { authenticateAdmin } from "../middleware/adminAuthMiddleware.ts";

const router = express.Router();

// Admin Dashboard stats route
router.get("/admin/dashboard/stats", authenticateAdmin, getDashboardStats);

export default router;
