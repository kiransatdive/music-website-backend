import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  bulkDeleteNotifications,
} from "../controllers/notificationController.js";
import { authenticateArtist } from "../middleware/artistAuthMiddleware.js";

const router = Router();

router.get("/notifications", authenticateArtist, getNotifications);
router.patch("/notifications/read-all", authenticateArtist, markAllAsRead);
router.patch("/notifications/:id/read", authenticateArtist, markAsRead);
router.delete("/notifications/bulk-delete", authenticateArtist, bulkDeleteNotifications);
router.delete("/notifications/:id", authenticateArtist, deleteNotification);

export default router;
