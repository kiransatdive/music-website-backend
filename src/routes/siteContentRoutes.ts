import express from "express";
import { authenticateAdmin } from "../middleware/adminAuthMiddleware.ts";
import { uploadSiteMedia } from "../middleware/uploadMiddleware.ts";
import {
  getContentBySection,
  getAllContent,
  createOrUpdateContent,
  deleteContent,
} from "../controllers/siteContentController.js";

const router = express.Router();

// Get all site content
router.get("/admin/content", getAllContent);

// Get content for a specific section
router.get("/admin/content/:section", getContentBySection);

// Create or update content
router.post("/admin/content", authenticateAdmin, uploadSiteMedia.any(), createOrUpdateContent);
router.put("/admin/content", authenticateAdmin, uploadSiteMedia.any(), createOrUpdateContent); // Optional alias for POST

// Delete content by ID
router.delete("/admin/content/:id", authenticateAdmin, deleteContent);

export default router;
