import { NextFunction, Request, Response } from "express";
import {
  ServiceError,
  verifyArtistToken,
} from "../services/artistAuthService.js";

export interface ArtistRequest extends Request {
  artist?: {
    id: number;
    email: string;
    role: string;
  };
}

export function authenticateArtist(
  req: ArtistRequest,
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
    const payload = verifyArtistToken(token);

    if (payload.role !== "artist") {
      return res.status(403).json({
        success: false,
        message: "Artist access only",
      });
    }

    req.artist = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };

    return next();
  } catch (error) {
    const message =
      error instanceof ServiceError ? error.message : "Authentication failed";

    return res.status(401).json({
      success: false,
      message,
    });
  }
}
