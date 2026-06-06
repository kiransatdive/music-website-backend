import { Router } from "express";
import { getAllArtists, getArtistById, deleteArtist, updateArtist } from "../controllers/adminArtistController.js";
import { authenticateAdmin } from "../middleware/adminAuthMiddleware.js";

const router = Router();

// All these routes require admin authentication
router.use("/admin/artists", authenticateAdmin);

router.get("/admin/artists", getAllArtists);
router.get("/admin/artists/:id", getArtistById);
router.put("/admin/artists/:id", updateArtist);
router.delete("/admin/artists/:id", deleteArtist);

export default router;
