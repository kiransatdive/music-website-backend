import { Request, Response } from "express";
import { loginAdminService } from "../services/adminAuthService.js";
import { ServiceError } from "../services/artistAuthService.js";

function sendError(res: Response, error: unknown, fallbackMessage: string) {
  if (error instanceof ServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: error instanceof Error ? error.message : fallbackMessage,
  });
}

function isMissing(value: unknown): boolean {
  return typeof value !== "string" || value.trim().length === 0;
}

export async function loginAdmin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (isMissing(email) || isMissing(password)) {
      return res.status(400).json({
        success: false,
        message: "email and password are required",
      });
    }

    const data = await loginAdminService({
      email: email.trim(),
      password,
    });

    return res.status(200).json({
      success: true,
      message: "Admin logged in successfully",
      data,
    });
  } catch (error) {
    return sendError(res, error, "Admin login failed");
  }
}
