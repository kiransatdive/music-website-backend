import { Router } from "express";
import {
  getAllPricingPlans,
  createPricingPlan,
  updatePricingPlan,
  deletePricingPlan,
} from "../controllers/pricingPlanController.js";
import { authenticateAdmin } from "../middleware/adminAuthMiddleware.ts";

const router = Router();


router.get("/admin/pricing-plans", getAllPricingPlans);
router.post("/admin/pricing-plans", authenticateAdmin, createPricingPlan);
router.put("/admin/pricing-plans/:id", authenticateAdmin, updatePricingPlan);
router.delete("/admin/pricing-plans/:id", authenticateAdmin, deletePricingPlan);

export default router;
