import { Router } from "express";
import youtubeCriteriaController from "../controllers/youtubeCriteriaController.js";
import { authenticateArtist } from "../middleware/artistAuthMiddleware.js";

const router = Router();

// Get active criteria (artists must be logged in to fetch them during release submission)
router.get(
  "/youtube-criteria",
  authenticateArtist,
  youtubeCriteriaController.getActiveCriteria.bind(youtubeCriteriaController),
);

export default router;
