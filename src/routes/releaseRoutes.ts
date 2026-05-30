import express from "express";
import releaseController from "../controllers/releaseController.js";
import {
  uploadAudio,
  uploadArtwork,
} from "../middleware/releaseUploadMiddleware.js";
import { authenticateArtist } from "../middleware/artistAuthMiddleware.js";

const router = express.Router();

// Apply artist authentication middleware to all release routes
router.use("/releases", authenticateArtist);

// Create a new release
router.post(
  "/releases",
  authenticateArtist,
  releaseController.createRelease.bind(releaseController),
);

// Get all releases for authenticated artist
router.get(
  "/releases",
  authenticateArtist,
  releaseController.getReleases.bind(releaseController),
);

// Get release counts/stats for artist
router.get(
  "/releases/stats",
  authenticateArtist,
  releaseController.getReleaseStats.bind(releaseController),
);

// Get release details
router.get(
  "/releases/:id",
  authenticateArtist,
  releaseController.getReleaseDetails.bind(releaseController),
);

// Update release details
router.put(
  "/releases/:id",
  authenticateArtist,
  releaseController.updateRelease.bind(releaseController),
);

// Delete release
router.delete(
  "/releases/:id",
  authenticateArtist,
  releaseController.deleteRelease.bind(releaseController),
);

// Upload track to releases
router.post(
  "/releases/:id/tracks",
  uploadAudio.single("track"),
  authenticateArtist,
  releaseController.uploadTrack.bind(releaseController),
);

// Upload artwork for release
router.post(
  "/releases/:id/artwork",
  uploadArtwork.single("artwork"),
  authenticateArtist,
  releaseController.uploadArtwork.bind(releaseController),
);

// Submit release for review
router.post(
  "/releases/:id/submit",
  releaseController.submitRelease.bind(releaseController),
);

export default router;
