import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController.js";
import { authenticateArtist } from "../middleware/artistAuthMiddleware.js";

const router = Router();

router.get("/notifications", authenticateArtist, getNotifications);
router.patch("/notifications/read-all", authenticateArtist, markAllAsRead);
router.patch("/notifications/:id/read", authenticateArtist, markAsRead);

export default router;
