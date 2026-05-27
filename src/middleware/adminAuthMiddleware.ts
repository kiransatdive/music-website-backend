import { NextFunction, Request, Response } from "express";
import { verifyAdminToken } from "../services/adminAuthService.js";
import { ServiceError } from "../services/artistAuthService.js";

export interface AdminRequest extends Request {
  admin?: {
    id: number;
    email: string;
    role: string;
  };
}

export function authenticateAdmin(
  req: AdminRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required",
      });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAdminToken(token);

    req.admin = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };

    return next();
  } catch (error) {
    const statusCode = error instanceof ServiceError ? error.statusCode : 401;
    const message =
      error instanceof ServiceError ? error.message : "Authentication failed";

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}
