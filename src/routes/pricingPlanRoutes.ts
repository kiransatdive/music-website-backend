import { Router } from "express";
import {
  getAllPricingPlans,
  createPricingPlan,
  updatePricingPlan,
  deletePricingPlan,
} from "../controllers/pricingPlanController.js";
import { authenticateAdmin } from "../middleware/adminAuthMiddleware.js";

const router = Router();

// All pricing plan APIs require admin access
router.use("/admin/pricing-plans", authenticateAdmin);

router.get("/admin/pricing-plans", getAllPricingPlans);
router.post("/admin/pricing-plans", createPricingPlan);
router.put("/admin/pricing-plans/:id", updatePricingPlan);
router.delete("/admin/pricing-plans/:id", deletePricingPlan);

export default router;
