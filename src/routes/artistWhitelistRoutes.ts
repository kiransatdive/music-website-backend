import { Router } from "express";
import artistWhitelistController from "../controllers/artistWhitelistController.js";
import { authenticateArtist } from "../middleware/artistAuthMiddleware.js";

const router = Router();

router.use("/artist/whitelist", authenticateArtist);

// Artist submits a domain for whitelist
router.post(
  "/artist/whitelist",
  artistWhitelistController.submitWhitelistDomain.bind(
    artistWhitelistController,
  ),
);

// Artist views their submitted domains
router.get(
  "/artist/whitelist",
  artistWhitelistController.getMyWhitelistDomains.bind(
    artistWhitelistController,
  ),
);

export default router;
