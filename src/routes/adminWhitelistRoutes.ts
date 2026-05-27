import { Router } from "express";
import adminWhitelistController from "../controllers/adminWhitelistController.js";
import { authenticateAdmin } from "../middleware/adminAuthMiddleware.js";

const router = Router();

// Protect all admin whitelist routes with admin middleware
router.use("/admin/whitelist", authenticateAdmin);

// Get All Whitelist Entries
router.get(
  "/admin/whitelist",
  adminWhitelistController.getWhitelistDomains.bind(adminWhitelistController),
);

// Get Single Entry
router.get(
  "/admin/whitelist/:id",
  adminWhitelistController.getWhitelistDomain.bind(adminWhitelistController),
);

// Delete Entry
router.delete(
  "/admin/whitelist/:id",
  adminWhitelistController.deleteWhitelistDomain.bind(adminWhitelistController),
);

// Toggle Active Status
router.patch(
  "/admin/whitelist/:id/status",
  adminWhitelistController.toggleStatus.bind(adminWhitelistController),
);

// Approve Domain
router.post(
  "/admin/whitelist/:id/approve",
  adminWhitelistController.approveDomain.bind(adminWhitelistController),
);

// Reject Domain
router.post(
  "/admin/whitelist/:id/reject",
  adminWhitelistController.rejectDomain.bind(adminWhitelistController),
);

export default router;
