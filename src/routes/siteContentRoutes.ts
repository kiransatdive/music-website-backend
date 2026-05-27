import express from "express";
import { authenticateAdmin } from "../middleware/adminAuthMiddleware.js";
import {
  getContentBySection,
  getAllContent,
  createOrUpdateContent,
  deleteContent,
} from "../controllers/siteContentController.js";

const router = express.Router();

// Get all site content
router.get("/admin/content", authenticateAdmin, getAllContent);

// Get content for a specific section
router.get("/admin/content/:section", authenticateAdmin, getContentBySection);

// Create or update content
router.post("/admin/content", authenticateAdmin, createOrUpdateContent);
router.put("/admin/content", authenticateAdmin, createOrUpdateContent); // Optional alias for POST

// Delete content by ID
router.delete("/admin/content/:id", authenticateAdmin, deleteContent);

export default router;
