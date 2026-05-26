import { Router } from 'express';
import {
  approveRelease,
  rejectRelease,
  markReleaseLive,
  takeDownRelease,
  getPendingReleases,
  getAllReleases,
} from '../controllers/adminReleaseController.js';
import { authenticateAdmin } from '../middleware/adminAuthMiddleware.js';

const router = Router();

// All these routes require admin authentication
router.use('/admin/releases', authenticateAdmin);

router.get('/admin/releases', getAllReleases);
router.get('/admin/releases/pending', getPendingReleases);
router.post('/admin/releases/:id/approve', approveRelease);
router.post('/admin/releases/:id/reject', rejectRelease);
router.post('/admin/releases/:id/live', markReleaseLive);
router.post('/admin/releases/:id/take-down', takeDownRelease);

export default router;
