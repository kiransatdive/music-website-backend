import { Request, Response } from "express";
import { PricingPlan } from "../models/index.js";

// Get all pricing plans
export const getAllPricingPlans = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const plans = await PricingPlan.findAll({
      order: [["price", "ASC"]],
    });
    res.status(200).json({ success: true, data: plans });
  } catch (error: any) {
    console.error("Error fetching pricing plans:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Create a new pricing plan
export const createPricingPlan = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, description, price, isActive } = req.body;

    if (!name || !description || price === undefined) {
      res
        .status(400)
        .json({
          success: false,
          message: "Name, description, and price are required",
        });
      return;
    }

    const plan = await PricingPlan.create({
      name,
      description,
      price,
      isActive: isActive !== undefined ? isActive : true,
    });

    res
      .status(201)
      .json({
        success: true,
        message: "Pricing plan created successfully",
        data: plan,
      });
  } catch (error: any) {
    console.error("Error creating pricing plan:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update a pricing plan
export const updatePricingPlan = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, price, isActive } = req.body;

    const plan = await PricingPlan.findByPk(id);

    if (!plan) {
      res
        .status(404)
        .json({ success: false, message: "Pricing plan not found" });
      return;
    }

    await plan.update({
      name: name !== undefined ? name : plan.name,
      description: description !== undefined ? description : plan.description,
      price: price !== undefined ? price : plan.price,
      isActive: isActive !== undefined ? isActive : plan.isActive,
    });

    res
      .status(200)
      .json({
        success: true,
        message: "Pricing plan updated successfully",
        data: plan,
      });
  } catch (error: any) {
    console.error("Error updating pricing plan:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete a pricing plan
export const deletePricingPlan = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const plan = await PricingPlan.findByPk(id);

    if (!plan) {
      res
        .status(404)
        .json({ success: false, message: "Pricing plan not found" });
      return;
    }

    await plan.destroy();

    res
      .status(200)
      .json({ success: true, message: "Pricing plan deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting pricing plan:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
