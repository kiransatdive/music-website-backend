import { Router } from "express";
import { getAllArtists } from "../controllers/adminArtistController.js";
import { authenticateAdmin } from "../middleware/adminAuthMiddleware.js";

const router = Router();

// All these routes require admin authentication
router.use("/admin/artists", authenticateAdmin);

router.get("/admin/artists", getAllArtists);

export default router;
