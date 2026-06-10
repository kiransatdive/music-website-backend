import { Router } from "express";
import artistWhitelistController from "../controllers/artistWhitelistController.ts";
import { authenticateArtist } from "../middleware/artistAuthMiddleware.ts";

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
