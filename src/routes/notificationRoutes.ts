import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController.js';
import { authenticateArtist } from '../middleware/artistAuthMiddleware.js';

const router = Router();

// All these routes require artist authentication
router.use('/notifications', authenticateArtist);

router.get('/notifications', getNotifications);
router.patch('/notifications/read-all', markAllAsRead);
router.patch('/notifications/:id/read', markAsRead);

export default router;
