import express from "express";
import { getDashboardStats } from "../controllers/adminDashboardController.js";
import { authenticateAdmin } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

// Admin Dashboard stats route
router.get("/admin/dashboard/stats", authenticateAdmin, getDashboardStats);

export default router;
