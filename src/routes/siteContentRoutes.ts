import express from 'express';
import { authenticateAdmin } from '../middleware/adminAuthMiddleware.js';
import {
  getContentBySection,
  getAllContent,
  createOrUpdateContent,
  deleteContent,
} from '../controllers/siteContentController.js';

const router = express.Router();

// All routes are protected by admin authentication as requested
router.use(authenticateAdmin);

// Get all site content
router.get('/admin/content', getAllContent);

// Get content for a specific section
router.get('/admin/content/:section', getContentBySection);

// Create or update content
router.post('/admin/content', createOrUpdateContent);
router.put('/admin/content', createOrUpdateContent); // Optional alias for POST

// Delete content by ID
router.delete('/admin/content/:id', deleteContent);

export default router;
