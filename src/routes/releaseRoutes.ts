import express from "express";
import releaseController from "../controllers/releaseController.ts";
import {
  uploadAudio,
  uploadArtwork,
} from "../middleware/releaseUploadMiddleware.js";
import { authenticateArtist } from "../middleware/artistAuthMiddleware.ts";

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

// Get all tracks for a release
router.get(
  "/releases/:id/tracks",
  authenticateArtist,
  releaseController.getTracks.bind(releaseController),
);

// Upload track to releases
router.post(
  "/releases/:id/tracks",
  uploadAudio.single("track"),
  authenticateArtist,
  releaseController.uploadTrack.bind(releaseController),
);

// Update track details
router.put(
  "/releases/:id/tracks/:trackId",
  authenticateArtist,
  uploadAudio.single("track"),
  releaseController.updateTrack.bind(releaseController),
);

// Delete track
router.delete(
  "/releases/:id/tracks/:trackId",
  authenticateArtist,
  releaseController.deleteTrack.bind(releaseController),
);

// Upload artwork for release
router.post(
  "/releases/:id/artwork",
  uploadArtwork.single("artwork"),
  authenticateArtist,
  releaseController.uploadArtwork.bind(releaseController),
);

// Update artwork for release
router.put(
  "/releases/:id/artwork",
  uploadArtwork.single("artwork"),
  authenticateArtist,
  releaseController.updateArtwork.bind(releaseController),
);

// Submit release for review
router.post(
  "/releases/:id/submit",
  releaseController.submitRelease.bind(releaseController),
);

// Add platforms to release
router.post(
  "/releases/:id/platforms",
  releaseController.addPlatforms.bind(releaseController),
);

export default router;
